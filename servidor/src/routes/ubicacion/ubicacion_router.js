import { Router } from "express";
import {
  listarProvinciasController,
  listarDepartamentosController,
  listarLocalidadesController,
} from "../../controllers/ubicacion/ubicacion_controller.js";

// Público y sin auth a propósito: es división política fija (provincia →
// departamento → localidad), la necesitan tanto el registro como el perfil
// de cliente para armar el select en cascada.
export const ubicacionRouter = Router();

ubicacionRouter.get("/provincias", listarProvinciasController);
ubicacionRouter.get("/departamentos", listarDepartamentosController);
ubicacionRouter.get("/localidades", listarLocalidadesController);
