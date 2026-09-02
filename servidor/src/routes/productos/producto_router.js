import { Router } from "express";
import multer from "multer";
import {
  listarProductosController, obtenerOfertasDestacadasController, obtenerStockBajoController,
  obtenerCatalogoCSVController, importarCatalogoCSVController,
  obtenerProductoController, crearProductoController, actualizarProductoController,
} from "../../controllers/productos/producto_controller.js";
import { requireAuth, requireRole } from "../../middleware/auth_middleware.js";
import { requireModuloHabilitado } from "../../middleware/modulo_middleware.js";

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    cb(ok ? null : new Error("Solo se permiten archivos .csv"), ok);
  },
});

export const productoRouter = Router();
productoRouter.use(requireModuloHabilitado("eccomerce_indumentaria"));

// Rutas específicas ANTES de "/:id" — si no, Express las matchea como id.
productoRouter.get("/ofertas/destacadas", obtenerOfertasDestacadasController);
productoRouter.get("/stock-bajo", requireAuth, requireRole("admin"), obtenerStockBajoController);
productoRouter.get("/catalogo-csv", requireAuth, requireRole("admin"), obtenerCatalogoCSVController);
productoRouter.post("/importar-csv", requireAuth, requireRole("admin"), uploadCsv.single("csv"), importarCatalogoCSVController);

productoRouter.get("/", listarProductosController);
productoRouter.get("/:id", obtenerProductoController);
productoRouter.post("/", requireAuth, requireRole("admin"), crearProductoController);
productoRouter.put("/:id", requireAuth, requireRole("admin"), actualizarProductoController);
