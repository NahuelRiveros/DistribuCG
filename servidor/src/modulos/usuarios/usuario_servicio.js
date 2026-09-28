import { Op } from "sequelize";
import { problemaGestion, rolesQuePuedeAsignar, rolPrincipal } from "compartido/reglas/usuarios.js";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { armarBusquedaTexto } from "../../nucleo/consultas.js";
import { armarPaginacion, normalizarPaginacion } from "../../nucleo/paginacion.js";
import { Conflicto, NoEncontrado, SinPermiso } from "../../nucleo/errores.js";
import { hashearContrasena } from "./auth_servicio.js";
import { Rol, Usuario } from "./modelos.js";

// "Usuarios" del panel: alta, rol, activar/desactivar y contraseña de otros usuarios.
// Los permisos (quién gestiona a quién) están en compartido/reglas/usuarios.js.
// Un cambio de rol o una desactivación rige desde el próximo pedido del usuario:
// los roles y `activo` se leen en cada request (nucleo/auth/middlewares.js).

const ATRIBUTOS = ["id", "nombre", "apellido", "email", "activo", "ultimo_login", "creado_en"];
const incluirRoles = { model: Rol, as: "roles", attributes: ["codigo"], through: { attributes: [] } };

// Lista cerrada: el filtro llega validado como una de estas claves, nunca texto libre.
const ROLES_POR_FILTRO = {
  panel: ["super_admin", "admin", "staff"],
  admin: ["admin"],
  staff: ["staff"],
  cliente: ["cliente"],
};

const EMAIL_EN_USO = "Ya hay un usuario con ese email. Buscalo en la lista para cambiarle el rol.";

function aRespuesta(usuario, actor) {
  const roles = (usuario.roles ?? []).map((r) => r.codigo);
  const datos = Object.fromEntries(ATRIBUTOS.map((campo) => [campo, usuario[campo]]));
  const problema = problemaGestion(actor, { id: usuario.id, roles });
  return { ...datos, roles, rol: rolPrincipal(roles), gestionable: !problema, motivo_no_gestionable: problema };
}

export async function listarUsuarios(actor, { q, rol = "panel", estado, pagina, limite }) {
  const pag = normalizarPaginacion({ pagina, limite });
  const codigos = ROLES_POR_FILTRO[rol].map((c) => sequelize.escape(c)).join(", ");
  const where = {
    eliminado_en: null,
    id: {
      [Op.in]: sequelize.literal(
        `(SELECT ur.usuario_id FROM ${DB_SCHEMA}.usuario_rol ur JOIN ${DB_SCHEMA}.rol r ON r.id = ur.rol_id WHERE r.codigo IN (${codigos}))`,
      ),
    },
  };
  if (estado) where.activo = estado === "activos";
  const busqueda = armarBusquedaTexto(["nombre", "apellido", "email"], q);
  if (busqueda) Object.assign(where, busqueda);

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    attributes: ATRIBUTOS,
    include: [incluirRoles],
    order: [["nombre", "ASC"], ["apellido", "ASC"], ["id", "ASC"]],
    limit: pag.limite,
    offset: pag.offset,
    distinct: true,
  });
  return { usuarios: rows.map((u) => aRespuesta(u, actor)), paginacion: armarPaginacion({ ...pag, total: count }) };
}

async function verUsuario(actor, id) {
  const usuario = await Usuario.findOne({ where: { id, eliminado_en: null }, attributes: ATRIBUTOS, include: [incluirRoles] });
  if (!usuario) throw new NoEncontrado("El usuario no existe.", "USUARIO_NO_ENCONTRADO");
  return aRespuesta(usuario, actor);
}

function exigirRolAsignable(actor, rol) {
  if (!rolesQuePuedeAsignar(actor).includes(rol)) {
    throw new SinPermiso("No podés dar ese rol. Solo el super admin crea administradores.", "ROL_NO_PERMITIDO");
  }
}

async function exigirEmailLibre(email, transaction, excepto_id = null) {
  const where = { email, eliminado_en: null };
  if (excepto_id) where.id = { [Op.ne]: excepto_id };
  if (await Usuario.findOne({ where, attributes: ["id"], transaction })) throw new Conflicto(EMAIL_EN_USO, "EMAIL_REGISTRADO");
}

async function rolPorCodigo(codigo, transaction) {
  return Rol.findOne({ where: { codigo }, transaction });
}

/**
 * Bloquea la fila del usuario y verifica que el actor pueda modificarlo.
 * El bloqueo evita que dos admins lo cambien a la vez y uno pise al otro.
 */
async function usuarioGestionable(actor, id, transaction) {
  const usuario = await Usuario.findOne({ where: { id, eliminado_en: null }, transaction, lock: transaction.LOCK.UPDATE });
  if (!usuario) throw new NoEncontrado("El usuario no existe.", "USUARIO_NO_ENCONTRADO");
  const roles = (await usuario.getRoles({ attributes: ["codigo"], transaction })).map((r) => r.codigo);
  const problema = problemaGestion(actor, { id: usuario.id, roles });
  if (problema) throw new SinPermiso(problema, "USUARIO_NO_GESTIONABLE");
  return { usuario, roles };
}

export async function crearUsuario(actor, { nombre, apellido, email, contrasena, rol }) {
  exigirRolAsignable(actor, rol);
  const id = await sequelize.transaction(async (transaction) => {
    await exigirEmailLibre(email, transaction);
    const usuario = await Usuario.create(
      { nombre, apellido: apellido || null, email, contrasena: await hashearContrasena(contrasena) },
      { transaction },
    );
    await usuario.setRoles([await rolPorCodigo(rol, transaction)], { transaction });
    return usuario.id;
  });
  return verUsuario(actor, id);
}

export async function editarUsuario(actor, id, { nombre, apellido, email, rol }) {
  exigirRolAsignable(actor, rol);
  await sequelize.transaction(async (transaction) => {
    const { usuario, roles } = await usuarioGestionable(actor, id, transaction);
    await exigirEmailLibre(email, transaction, usuario.id);
    await usuario.update({ nombre, apellido: apellido || null, email }, { transaction });
    if (rolPrincipal(roles) !== rol || roles.length !== 1) {
      await usuario.setRoles([await rolPorCodigo(rol, transaction)], { transaction });
    }
  });
  return verUsuario(actor, id);
}

/** Desactivar no borra nada: el historial (pedidos, movimientos) sigue mostrando quién hizo cada cosa. */
export async function cambiarEstadoUsuario(actor, id, { activo }) {
  await sequelize.transaction(async (transaction) => {
    const { usuario } = await usuarioGestionable(actor, id, transaction);
    await usuario.update({ activo }, { transaction });
  });
  return verUsuario(actor, id);
}

/** Al cambiar la contraseña, las sesiones abiertas de ese usuario dejan de valer (versión de contraseña en el token). */
export async function cambiarContrasenaUsuario(actor, id, { contrasena }) {
  await sequelize.transaction(async (transaction) => {
    const { usuario } = await usuarioGestionable(actor, id, transaction);
    await usuario.update({ contrasena: await hashearContrasena(contrasena) }, { transaction });
  });
  return verUsuario(actor, id);
}
