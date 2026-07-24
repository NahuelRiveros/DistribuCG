import { Router } from "express";
import {
  listarStaffController,
  crearStaffController,
  actualizarStaffController,
  cambiarPasswordStaffController,
  cambiarEstadoStaffController,
} from "../controllers/admin_staff_controllers.js";

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