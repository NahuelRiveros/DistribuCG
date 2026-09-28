import { Router } from "express";
import { importacionCatalogo as config } from "compartido/importacion_catalogo.js";
import { z } from "compartido/zod.js";
import { recibirArchivo } from "../../../nucleo/archivos.js";
import { ErrorApp } from "../../../nucleo/errores.js";
import { validar } from "../../../nucleo/validar.js";
import * as importacion from "./importacion_controlador.js";

const archivoPlanilla = recibirArchivo({
  campo: "archivo",
  maxMb: config.maxMb,
  extensiones: [".xlsx", ".csv"],
  mensajeTipo: "Solo se aceptan archivos .xlsx o .csv. Los .xls viejos se pueden guardar como .xlsx desde Excel.",
});

// Leer planillas grandes consume memoria: como mucho 2 lecturas a la vez en el servidor.
let lecturasEnCurso = 0;
function limitarLecturas(req, res, next) {
  if (lecturasEnCurso >= 2) throw new ErrorApp(429, "SERVIDOR_OCUPADO", "Hay otros archivos leyéndose. Reintentá en unos segundos.");
  lecturasEnCurso++;
  let liberada = false;
  const liberar = () => {
    if (!liberada) {
      liberada = true;
      lecturasEnCurso--;
    }
  };
  res.once("finish", liberar);
  res.once("close", liberar);
  next();
}

const idImportacion = { params: z.object({ id: z.uuid("Identificador de importación inválido") }) };
const loteSchema = z.object({
  indice: z.number().int().min(0),
  confirmar: z.boolean().optional().default(false),
  omitir_errores: z.boolean().optional().default(false),
});

// Se monta dentro de catalogoRutas (ya exige sesión de admin/staff y módulo activo).
export const importacionRutas = Router();
importacionRutas.get("/plantilla", importacion.plantilla);
importacionRutas.get("/historial", importacion.historial);
importacionRutas.post("/previsualizar", limitarLecturas, archivoPlanilla, importacion.previsualizar);
importacionRutas.post("/validar", limitarLecturas, archivoPlanilla, importacion.validar);
importacionRutas.get("/:id", validar(idImportacion), importacion.obtener);
importacionRutas.get("/:id/informe", validar(idImportacion), importacion.informe);
importacionRutas.post("/:id/lote", validar({ ...idImportacion, body: loteSchema }), importacion.ejecutarLote);
importacionRutas.post("/:id/cancelar", validar(idImportacion), importacion.cancelar);
