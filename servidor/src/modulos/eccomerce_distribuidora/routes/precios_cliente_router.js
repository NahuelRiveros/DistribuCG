import { Router } from "express";
import multer from "multer";
import { listaPreciosClienteConfig as config } from "../../../../../rubros/eccomerce_distribuidora/lista_precios_cliente_config.js";
import {
  validarPreciosClienteController, historialPreciosClienteController, detallePreciosClienteController, filasPreciosClienteController,
  decisionesPreciosClienteController, lotePreciosClienteController, cancelarPreciosClienteController, deshacerPreciosClienteController,
  informePreciosClienteController,
} from "../controllers/precios_cliente_controller.js";
import { requireAuth, requirePermiso } from "../../../core/middleware/auth_middleware.js";

const subida = multer({
  storage: multer.memoryStorage(), limits: { fileSize: config.maxBytes, files: 1, fields: 2, fieldSize: 1024 },
  fileFilter: (_req, file, cb) => cb(/\.xlsx$/i.test(file.originalname) ? null : Object.assign(new Error("Subí el Excel (.xlsx) que exporta el sistema. Si es .xls, guardalo como .xlsx."), { status: 400 }), true),
});

// Una lectura de Excel por vez: el archivo del cliente es chico, pero no conviene leer varios en paralelo.
let leyendo = false;
function turno(_req, res, next) {
  if (leyendo) return res.status(429).json({ ok: false, mensaje: "Hay otra lista en lectura. Reintentá en unos segundos." });
  leyendo = true;
  let liberado = false;
  const liberar = () => { if (!liberado) { liberado = true; leyendo = false; } };
  res.once("finish", liberar); res.once("close", liberar); next();
}

// PRE-30: solo escribe precios (y la marca de sin precio), así que alcanza con "Cambiar precios".
export const preciosClienteRouter = Router();
preciosClienteRouter.use(requireAuth, requirePermiso("precios.editar"));
preciosClienteRouter.get("/historial", historialPreciosClienteController);
preciosClienteRouter.post("/validar", turno, subida.single("archivo"), validarPreciosClienteController);
preciosClienteRouter.get("/:id", detallePreciosClienteController);
preciosClienteRouter.get("/:id/filas", filasPreciosClienteController);
preciosClienteRouter.get("/:id/informe", informePreciosClienteController);
preciosClienteRouter.post("/:id/decisiones", decisionesPreciosClienteController);
preciosClienteRouter.post("/:id/lote", lotePreciosClienteController);
preciosClienteRouter.post("/:id/cancelar", cancelarPreciosClienteController);
preciosClienteRouter.post("/:id/deshacer", deshacerPreciosClienteController);
preciosClienteRouter.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const grande = error.code === "LIMIT_FILE_SIZE";
  res.status(grande ? 413 : error.status || 400).json({ ok: false, mensaje: grande ? "El archivo supera 20 MB." : error.status ? error.message : "Archivo inválido." });
});
