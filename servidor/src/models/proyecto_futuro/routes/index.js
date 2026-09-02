import { Router } from "express";
import { sequelize } from "../database/sequelize.js";

import { authRouter }       from "./auth_routes.js";
import { usuariosRouter }   from "./usuarios_routes.js";
import { catalogosRouter }  from "./catalogos_routes.js";
import { adminRouter }      from "./admin_routes.js";
import { productosRouter }  from "./productos_routes.js";
import { carritoRouter }    from "./carrito_routes.js";
import { ordenesRouter }    from "./ordenes_routes.js";
import { uploadRouter }     from "./upload_routes.js";
import { homeConfigRouter }     from "./home_config_routes.js";
import { whatsappConfigRouter } from "./whatsapp_config_routes.js";
import { mediosPagoRouter }    from "./medios_pago_routes.js";

import { verificarSuscripcion } from "../middleware/suscripcion_middleware.js";

// ── Routers de dominio (descomentar cuando el dominio esté listo) ──
// import { personasRouter } from "./personas_routes.js";

const router = Router();

// ==========================================================
// HEALTH CHECK + DB (siempre accesible)
// ==========================================================

router.get("/health", async (_req, res) => {
  try {
    await sequelize.query("SELECT 1");
    return res.json({ ok: true, mensaje: "Servidor y base de datos funcionando", timestamp: new Date() });
  } catch {
    return res.status(500).json({ ok: false, mensaje: "Servidor activo pero la base de datos no responde" });
  }
});

// ==========================================================
// AUTH — siempre accesible (login debe funcionar aunque esté vencida)
// ==========================================================

router.use("/auth", authRouter);

// ==========================================================
// ADMIN — siempre accesible (el admin debe poder renovar aunque vencida)
// ==========================================================

router.use("/admin", adminRouter);

// ==========================================================
// MIDDLEWARE DE SUSCRIPCIÓN
// Se aplica a todo lo que venga después (usuarios, catalogos, dominio).
// /auth y /admin están exentos por estar montados antes.
// ==========================================================

router.use(verificarSuscripcion);

// ==========================================================
// RUTAS PROTEGIDAS POR SUSCRIPCIÓN
// ==========================================================

router.use("/usuarios",  usuariosRouter);
router.use("/catalogos", catalogosRouter);

// ==========================================================
// ROUTERS DEL PROYECTO ANGAR
// ==========================================================

router.use("/productos",   productosRouter);
router.use("/carrito",    carritoRouter);
router.use("/ordenes",    ordenesRouter);
router.use("/upload",     uploadRouter);
router.use("/home-config",      homeConfigRouter);
router.use("/config/whatsapp",     whatsappConfigRouter);
router.use("/config/medios-pago",  mediosPagoRouter);

// router.use("/personas", personasRouter);

export default router;
