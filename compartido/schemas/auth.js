import { z } from "../zod.js";
import { proyecto } from "../proyecto.js";

const { contrasena_max, contrasena_min } = proyecto.usuarios;

// Campos reutilizados por el registro de clientes y por "Usuarios" del panel.
export const campoNombre = z.string({ error: "Ingresá el nombre" }).trim().min(2, "Ingresá el nombre").max(80, "El nombre es demasiado largo");
export const campoApellido = z.string().trim().max(80, "El apellido es demasiado largo").optional().default("");
export const campoEmail = z.string({ error: "Ingresá un email válido" }).trim().toLowerCase().email("Ingresá un email válido").max(150);
export const campoContrasena = z
  .string({ error: `La contraseña tiene que tener al menos ${contrasena_min} caracteres` })
  .min(contrasena_min, `La contraseña tiene que tener al menos ${contrasena_min} caracteres`)
  .max(contrasena_max, `La contraseña puede tener hasta ${contrasena_max} caracteres`);

export const registroSchema = z.object({
  nombre: campoNombre,
  apellido: campoApellido,
  email: campoEmail,
  contrasena: campoContrasena,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido"),
  contrasena: z
    .string()
    .min(1, "Ingresá tu contraseña")
    .max(contrasena_max, `La contraseña puede tener hasta ${contrasena_max} caracteres`),
});
