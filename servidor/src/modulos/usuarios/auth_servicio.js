import bcrypt from "bcryptjs";
import { Usuario, Rol, ATRIBUTOS_PUBLICOS } from "./modelos.js";
import { firmarToken } from "../../nucleo/auth/tokens.js";
import { proyecto } from "compartido/proyecto.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { Conflicto, NoAutorizado, NoEncontrado } from "../../nucleo/errores.js";

const CREDENCIALES_INCORRECTAS = "Email o contraseña incorrectos.";
// Hash de relleno: si el email no existe igual se compara una contraseña,
// así la respuesta tarda lo mismo y no revela qué emails están registrados.
const HASH_RELLENO = bcrypt.hashSync("contrasena-de-relleno", 10);

const incluirRoles = { model: Rol, as: "roles", attributes: ["codigo"], through: { attributes: [] } };

function usuarioPublico(usuario) {
  const datos = {};
  for (const campo of ATRIBUTOS_PUBLICOS) datos[campo] = usuario[campo];
  return { ...datos, roles: (usuario.roles ?? []).map((r) => r.codigo) };
}

export async function iniciarSesion({ email, contrasena }) {
  const usuario = await Usuario.findOne({ where: { email, eliminado_en: null }, include: [incluirRoles] });
  const coincide = await bcrypt.compare(contrasena, usuario?.contrasena ?? HASH_RELLENO);

  if (!usuario || !coincide) throw new NoAutorizado(CREDENCIALES_INCORRECTAS, "CREDENCIALES_INCORRECTAS");
  if (!usuario.activo) throw new NoAutorizado("Tu cuenta está suspendida. Contactá al negocio.", "CUENTA_SUSPENDIDA");

  await usuario.update({ ultimo_login: new Date() });
  return { token: firmarToken(usuario), usuario: usuarioPublico(usuario) };
}

export async function obtenerPerfil(usuario_id) {
  const usuario = await Usuario.findOne({
    where: { id: usuario_id, eliminado_en: null },
    attributes: ATRIBUTOS_PUBLICOS,
    include: [incluirRoles],
  });
  if (!usuario) throw new NoEncontrado("El usuario no existe.", "USUARIO_NO_ENCONTRADO");
  return usuarioPublico(usuario);
}

/** Alta de un cliente desde la tienda. Queda con sesión iniciada. */
export async function registrarCliente({ nombre, apellido, email, contrasena }) {
  if (!proyecto.usuarios.registro_publico) throw new NoEncontrado("La ruta no existe.", "RUTA_NO_ENCONTRADA");
  await sequelize.transaction(async (transaction) => {
    if (await Usuario.findOne({ where: { email, eliminado_en: null }, attributes: ["id"], transaction })) {
      throw new Conflicto("Ya hay una cuenta con ese email. Ingresá con tu contraseña.", "EMAIL_REGISTRADO");
    }
    const usuario = await Usuario.create({ nombre, apellido: apellido || null, email, contrasena: await hashearContrasena(contrasena) }, { transaction });
    const cliente = await Rol.findOne({ where: { codigo: "cliente" }, transaction });
    await usuario.addRoles([cliente], { transaction });
  });
  return iniciarSesion({ email, contrasena });
}

export function hashearContrasena(contrasena) {
  return bcrypt.hash(contrasena, 10);
}
