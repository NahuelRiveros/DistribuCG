import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

import {
  AlumnosNuevos,
  VencimientosProximos7Dias,
  Asistencias,
  AsistenciasHoras,
  AsistenciasHorasDia,
  PlanesPopulares,
} from "../../controllers/gym/estadisticas_controller.js";

export const estadisticasRouter = Router();
// Nota: este router no tenía ningún guard de auth — se agrega acá junto con
// el gate de módulo, consistente con cómo el frontend ya protege estas rutas.
estadisticasRouter.use(requireAuth, requireModuloHabilitado("gym"), requireRole("admin"));

/**
 * =========================
 * ALUMNOS
 * =========================
 */
estadisticasRouter.get("/alumnos_Nuevos", AlumnosNuevos);

/**
 * =========================
 * VENCIMIENTOS
 * =========================
 */
estadisticasRouter.get("/vencimientos", VencimientosProximos7Dias);

/**
 * =========================
 * ASISTENCIAS
 * =========================
 */
estadisticasRouter.get("/asistencias", Asistencias);

/**
 * =========================
 * ASISTENCIAS POR HORA
 * =========================
 */
estadisticasRouter.get("/asistencias_horas", AsistenciasHoras);

/**
 * =========================
 * ASISTENCIAS HEATMAP
 * =========================
 */
estadisticasRouter.get("/asistencias_horas_dia", AsistenciasHorasDia);

/**
 * =========================
 * PLANES MÁS POPULARES
 * =========================
 */
estadisticasRouter.get("/planes-populares", PlanesPopulares);
