import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import {
  buscarPersona,
  agregarPaciente,
  listaPacientes,
  detallePaciente,
  crearTestFuncional,
  crearTestFuerza,
  crearSesion,
} from "../controllers/kinesiologia_controller.js";

export const kinesiologiaRouter = Router();
kinesiologiaRouter.use(requireAuth, requireRole("admin", "staff"));

kinesiologiaRouter.get("/personas/buscar", buscarPersona);

kinesiologiaRouter.post("/pacientes", agregarPaciente);
kinesiologiaRouter.get("/pacientes", listaPacientes);
kinesiologiaRouter.get("/pacientes/:id/ficha", detallePaciente);

kinesiologiaRouter.post("/fichas/:id/test-funcional", crearTestFuncional);
kinesiologiaRouter.post("/fichas/:id/test-fuerza", crearTestFuerza);
kinesiologiaRouter.post("/fichas/:id/sesiones", crearSesion);
