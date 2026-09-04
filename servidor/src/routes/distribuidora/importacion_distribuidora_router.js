import { Router } from "express";
import multer from "multer";
import { previsualizarImportacionController, ejecutarImportacionController } from "../../controllers/distribuidora/importacion_distribuidora_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

// Mismo patrón que routes/productos/producto_router.js (uploadCsv) — memoria,
// no disco, tamaño acotado. Acá se acepta .xlsx además de .csv (exceljs lee
// ambos) porque el catálogo real del cliente va a venir en Excel.
const uploadImportacion = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const nombre = file.originalname.toLowerCase();
    const ok = nombre.endsWith(".xlsx") || nombre.endsWith(".csv");
    cb(ok ? null : new Error("Solo se permiten archivos .xlsx o .csv"), ok);
  },
});

export const importacionDistribuidoraRouter = Router();
importacionDistribuidoraRouter.use(requireModuloHabilitado("eccomerce_distribuidora"), requireAuth, requireRole("admin", "staff"));

importacionDistribuidoraRouter.post("/previsualizar", uploadImportacion.single("archivo"), previsualizarImportacionController);
importacionDistribuidoraRouter.post("/ejecutar", uploadImportacion.single("archivo"), ejecutarImportacionController);
