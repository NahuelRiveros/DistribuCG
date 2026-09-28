import { proyecto } from "compartido/proyecto.js";
import { tieneRol } from "compartido/reglas/roles.js";
import { Usuario, Rol } from "../../modulos/usuarios/modelos.js";
import { NoAutorizado, NoEncontrado, SinPermiso } from "../errores.js";
import { verificarToken, versionContrasena } from "./tokens.js";

// Adaptado de DistribuCG (middleware/auth_middleware.js): ahora lanzan errores
// en vez de responder, y el manejador central arma la respuesta.

async function usuarioDelToken(req) {
  const cabecera = req.headers.authorization ?? "";
  if (!cabecera.startsWith("Bearer ")) return null;

  let payload;
  try {
    payload = verificarToken(cabecera.slice(7));
  } catch {
    throw new NoAutorizado("Tu sesión venció. Ingresá nuevamente.", "SESION_VENCIDA");
  }

  const usuario = await Usuario.findByPk(payload.sub, {
    include: [{ model: Rol, as: "roles", attributes: ["codigo"], through: { attributes: [] } }],
  });
  if (!usuario || !usuario.activo || usuario.eliminado_en || payload.pv !== versionContrasena(usuario.contrasena)) {
    throw new NoAutorizado("Tu sesión venció. Ingresá nuevamente.", "SESION_VENCIDA");
  }
  return { id: usuario.id, roles: usuario.roles.map((r) => r.codigo) };
}

export async function requerirAuth(req, _res, next) {
  req.usuario = await usuarioDelToken(req);
  if (!req.usuario) throw new NoAutorizado();
  next();
}

// Rutas públicas que muestran más si hay sesión (ej. catálogo para admin).
// Un token vencido no bloquea: se navega como visitante.
export async function authOpcional(req, _res, next) {
  try {
    req.usuario = await usuarioDelToken(req);
  } catch (error) {
    if (!(error instanceof NoAutorizado)) throw error;
    req.usuario = null;
  }
  next();
}

export { tieneRol };

export function requerirRol(...roles) {
  return (req, _res, next) => {
    if (!tieneRol(req.usuario, roles)) throw new SinPermiso();
    next();
  };
}

// Un módulo apagado en proyecto.config.js responde como si la ruta no existiera.
export function requerirModulo(codigo) {
  return (_req, _res, next) => {
    if (!proyecto.modulos[codigo]) throw new NoEncontrado("La ruta no existe.", "RUTA_NO_ENCONTRADA");
    next();
  };
}
