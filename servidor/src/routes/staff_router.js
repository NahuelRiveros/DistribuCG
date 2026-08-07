import { Router } from "express";
import {
  listarStaffController,
  crearStaffController,
  actualizarStaffController,
  cambiarPasswordStaffController,
  cambiarEstadoStaffController,
  cambiarRolStaffController,
  eliminarStaffController,
} from "../controllers/admin_staff_controller.js";

import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

export const staffRouter = Router();

// protección global → solo admin
staffRouter.use(requireAuth, requireRole("admin"));

// 📋 listar usuarios (staff/admin)
staffRouter.get("/", listarStaffController);

// ➕ crear staff
staffRouter.post("/", crearStaffController);

// ✏️ editar datos (nombre, apellido, email, documento)
staffRouter.put("/:usuarioId", actualizarStaffController);

// 🔑 cambiar contraseña
staffRouter.patch("/:usuarioId/password", cambiarPasswordStaffController);

// 🔄 activar / desactivar usuario
staffRouter.patch("/:usuarioId/estado", cambiarEstadoStaffController);

// 🎭 cambiar rol (por usuario_rol_id, la fila específica de la relación)
staffRouter.patch("/rol/:usuarioRolId", cambiarRolStaffController);

// 🗑️ eliminar (baja definitiva, soft-delete)
staffRouter.delete("/:usuarioId", eliminarStaffController);