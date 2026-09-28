import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import {
  listarUsuariosQuery,
  usuarioContrasenaSchema,
  usuarioCrearSchema,
  usuarioEditarSchema,
  usuarioEstadoSchema,
} from "compartido/schemas/usuarios.js";
import { requerirAuth, requerirRol } from "../../nucleo/auth/middlewares.js";
import { validar } from "../../nucleo/validar.js";
import * as usuarios from "./usuario_controlador.js";

// "Usuarios" del panel (/api/usuarios): solo admin (y super_admin, que pasa cualquier rol).
// A quién puede tocar cada uno lo controla el servicio con compartido/reglas/usuarios.js.
export const usuariosRutas = Router();
usuariosRutas.use(requerirAuth, requerirRol("admin"));

usuariosRutas.get("/", validar({ query: listarUsuariosQuery }), usuarios.listar);
usuariosRutas.post("/", validar({ body: usuarioCrearSchema }), usuarios.crear);
usuariosRutas.patch("/:id", validar({ params: idParams, body: usuarioEditarSchema }), usuarios.editar);
usuariosRutas.patch("/:id/estado", validar({ params: idParams, body: usuarioEstadoSchema }), usuarios.cambiarEstado);
usuariosRutas.put("/:id/contrasena", validar({ params: idParams, body: usuarioContrasenaSchema }), usuarios.cambiarContrasena);
