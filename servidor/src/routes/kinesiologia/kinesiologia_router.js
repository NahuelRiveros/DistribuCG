import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";
import {
  buscarPersona,
  listaPersonasRegistradas,
  agregarPaciente,
  listaPacientes,
  cambiarEstadoPaciente,
  detallePaciente,
  crearTestFuncional,
  crearTestFuerza,
  crearSesion,
  actualizarSesion,
  eliminarSesion,
  guardarRutina,
  listaPatologias,
  crearPatologiaController,
  actualizarPatologiaController,
  cambiarEstadoPatologiaController,
} from "../../controllers/kinesiologia/kinesiologia_controller.js";

export const kinesiologiaRouter = Router();
// Gate de licencia primero (bloquea incluso a admin si el módulo está apagado),
// después el rol — solo admin (dueño/superusuario) y kinesiologo, staff genérico no entra acá.
kinesiologiaRouter.use(requireAuth, requireModuloHabilitado("kinesiologia"), requireRole("admin", "kinesiologo"));

kinesiologiaRouter.get("/personas/buscar", buscarPersona);
kinesiologiaRouter.get("/personas", listaPersonasRegistradas);

kinesiologiaRouter.post("/pacientes", agregarPaciente);
kinesiologiaRouter.get("/pacientes", listaPacientes);
kinesiologiaRouter.patch("/pacientes/:id/estado", cambiarEstadoPaciente);
kinesiologiaRouter.get("/pacientes/:id/ficha", detallePaciente);

kinesiologiaRouter.post("/fichas/:id/test-funcional", crearTestFuncional);
kinesiologiaRouter.post("/fichas/:id/test-fuerza", crearTestFuerza);
kinesiologiaRouter.post("/fichas/:id/sesiones", crearSesion);
kinesiologiaRouter.put("/sesiones/:id", actualizarSesion);
kinesiologiaRouter.delete("/sesiones/:id", eliminarSesion);
kinesiologiaRouter.put("/fichas/:id/rutina", guardarRutina);

kinesiologiaRouter.get("/patologias", listaPatologias);
kinesiologiaRouter.post("/patologias", crearPatologiaController);
kinesiologiaRouter.put("/patologias/:id", actualizarPatologiaController);
kinesiologiaRouter.patch("/patologias/:id/estado", cambiarEstadoPatologiaController);
