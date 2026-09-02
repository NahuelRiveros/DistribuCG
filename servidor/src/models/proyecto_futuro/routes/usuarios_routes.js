// =============================================================
// routes/usuarios_routes.js
//
// GET    /api/usuarios                        → listar todos
// GET    /api/usuarios/:id                    → obtener uno
// POST   /api/usuarios                        → crear desde admin
// PUT    /api/usuarios/:id                    → actualizar datos
// DELETE /api/usuarios/:id                    → baja lógica
// PUT    /api/usuarios/:id/reactivar          → reactivar
//
// Gestión de roles (N:N):
// PUT    /api/usuarios/:id/roles              → reemplazar todos los roles
// POST   /api/usuarios/:id/roles/:abreviatura → agregar un rol
// DELETE /api/usuarios/:id/roles/:abreviatura → quitar un rol
// =============================================================

import { Router } from "express";

import {
  crearUsuarioController,
  listarUsuariosController,
  obtenerUsuarioController,
  actualizarUsuarioController,
  eliminarUsuarioController,
  reactivarUsuarioController,
  asignarRolesController,
  agregarRolController,
  quitarRolController,
  resetearPasswordController,
  perfilController,
} from "../controllers/usuarios_controller.js";

import { requireAuth, requireAccess } from "../middleware/auth_middleware.js";
import { ACCESS } from "./access_roles.js";
import { Auth02Usuario } from "../models/index.js";
import { env } from "../configuracion_servidor/env.js";

export const usuariosRouter = Router();

// Todas las rutas requieren auth
usuariosRouter.use(requireAuth);

// =============================================================
// GUARDIA: bloquea operaciones destructivas sobre el super admin.
// El super admin (SUPER_ADMIN_EMAIL) no puede eliminarse, desactivarse
// ni perder sus roles desde la API — debe modificarse directamente en DB.
// =============================================================

async function protegerSuperAdmin(req, res, next) {
  const usuario = await Auth02Usuario.findByPk(req.params.id, {
    attributes: ["AUTH02_EMAIL"],
  });
  if (!usuario) return next(); // 404 lo maneja el controller

  if (usuario.AUTH02_EMAIL === env.SUPER_ADMIN_EMAIL) {
    return res.status(403).json({
      ok: false,
      codigo: "USUARIO_PROTEGIDO",
      mensaje: "El usuario super administrador del sistema no puede modificarse desde la API",
    });
  }
  next();
}

// =============================================================
// LECTURA
// =============================================================

// ⚠️ /perfil va ANTES de /:id para que "perfil" no sea capturado como un :id
usuariosRouter.get("/perfil", perfilController); // propio perfil — cualquier usuario autenticado

usuariosRouter.get("/",    requireAccess(ACCESS.USUARIOS_GET), listarUsuariosController);
usuariosRouter.get("/:id", requireAccess(ACCESS.USUARIOS_GET), obtenerUsuarioController);

// =============================================================
// ESCRITURA
// =============================================================

usuariosRouter.post("/",    requireAccess(ACCESS.USUARIOS_CREATE), crearUsuarioController);
usuariosRouter.put("/:id",  requireAccess(ACCESS.USUARIOS_UPDATE), actualizarUsuarioController);

// =============================================================
// BAJA / REACTIVAR
// ⚠️  reactivar va ANTES de /:id para no ser capturado como :id
// =============================================================

usuariosRouter.put("/:id/reactivar", requireAccess(ACCESS.USUARIOS_DELETE), protegerSuperAdmin, reactivarUsuarioController);
usuariosRouter.delete("/:id",        requireAccess(ACCESS.USUARIOS_DELETE), protegerSuperAdmin, eliminarUsuarioController);

// Reset de contraseña por admin (sin conocer la actual)
usuariosRouter.put("/:id/password",  requireAccess(ACCESS.USUARIOS_UPDATE), protegerSuperAdmin, resetearPasswordController);

// =============================================================
// GESTIÓN DE ROLES (N:N)
// ⚠️  Las rutas con subrutas van antes que /:id genérico
// =============================================================

// Reemplaza todos los roles activos del usuario
usuariosRouter.put("/:id/roles", requireAccess(ACCESS.USUARIOS_ROLES), protegerSuperAdmin, asignarRolesController);

// Agrega o quita un rol específico por su abreviatura
usuariosRouter.post(  "/:id/roles/:abreviatura", requireAccess(ACCESS.USUARIOS_ROLES), protegerSuperAdmin, agregarRolController);
usuariosRouter.delete("/:id/roles/:abreviatura", requireAccess(ACCESS.USUARIOS_ROLES), protegerSuperAdmin, quitarRolController);
