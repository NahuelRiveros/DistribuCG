import { z } from "../zod.js";
import { ROLES_ASIGNABLES } from "../reglas/usuarios.js";
import { campoApellido, campoContrasena, campoEmail, campoNombre } from "./auth.js";
import { paginacionQuery } from "./comunes.js";

// "Usuarios" del panel (/api/usuarios). Qué rol puede dar cada uno lo decide reglas/usuarios.js.

const campoRol = z.enum(Object.keys(ROLES_ASIGNABLES), { error: "Elegí un rol" });

export const usuarioEditarSchema = z.object({
  nombre: campoNombre,
  apellido: campoApellido,
  email: campoEmail,
  rol: campoRol,
});

export const usuarioCrearSchema = usuarioEditarSchema.extend({ contrasena: campoContrasena });

export const usuarioContrasenaSchema = z
  .object({ contrasena: campoContrasena, confirmar: z.string() })
  .refine((d) => d.contrasena === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" });

export const usuarioEstadoSchema = z.object({ activo: z.boolean({ error: "Indicá si queda activo" }) });

// "panel" = todos los que entran al panel (super admin, admin y personal).
export const FILTROS_ROL = ["panel", "admin", "staff", "cliente"];

export const listarUsuariosQuery = z.object({
  q: z.string().trim().max(120).optional(),
  rol: z.enum(FILTROS_ROL).optional(),
  estado: z.enum(["activos", "inactivos"]).optional(),
  ...paginacionQuery,
});
