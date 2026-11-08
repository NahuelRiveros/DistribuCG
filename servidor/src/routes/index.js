import { Router } from "express";
import { sequelize } from "../database/sequelize.js"; // 👈 IMPORTANTE

import { authRouter } from "./usuarios/auth_router.js";
import { catalogosRouter } from "./sistema/catalogos_router.js";
import { staffRouter } from "./usuarios/staff_router.js";
import { permisosRouter } from "./usuarios/permisos_router.js";
import { suscripcionRouter } from "./sistema/suscripcion_router.js";
import { homeRouter } from "./home/home_router.js";
import { modulosRouter } from "./sistema/modulos_router.js";
import { ubicacionRouter } from "./ubicacion/ubicacion_router.js";
import { bannerAnuncioRouter } from "./sistema/banner_anuncio_router.js";
import { verificarSuscripcion } from "../middleware/suscripcion_middleware.js";

import { uploadRouter } from "./upload_router.js";

import { modulosActivos } from "../modulos/index.js";

const router = Router();

/**
 * 🔥 HEALTH CHECK (SIN AUTH)
 */
// Render y el aviso de "despertando el servidor" la consultan seguido: por defecto
// NO toca la base, para que la base pueda suspenderse. `?bd=1` también prueba la base.
router.get("/health", async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.query.bd !== "1") {
    return res.json({ ok: true, mensaje: "Servidor funcionando", base_de_datos: "sin_revisar" });
  }
  try {
    await sequelize.query("SELECT 1");

    return res.json({
      ok: true,
      mensaje: "Servidor y base funcionando",
      base_de_datos: "ok",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: "Servidor activo pero DB caída",
    });
  }
});

// Bloquea todas las rutas operativas si la suscripción está vencida.
// Siempre pasan: /health, /auth, /suscripcion, /catalogos
router.use(verificarSuscripcion);

/**
 * 🔽 TUS ROUTES
 */
router.use("/catalogos", catalogosRouter);
router.use("/auth", authRouter);
router.use("/staff", staffRouter);
router.use("/permisos", permisosRouter);                // ← roles y permisos del personal
router.use("/suscripcion", suscripcionRouter);       // ← plan del software
router.use("/home",  homeRouter);                     // ← contenido configurable del home (GET público)
router.use("/modulos", modulosRouter);                // ← gestión de módulos de negocio habilitados
router.use("/ubicacion", ubicacionRouter);            // ← provincia/departamento/localidad (público, sin auth)
router.use("/banner", bannerAnuncioRouter);           // ← cinta de anuncios (GET público, gestión solo super_admin)

router.use("/upload",    uploadRouter);                 // ← subida genérica de imágenes (Cloudinary)

// Rutas de cada módulo de rubro activo (ver su modulo.js).
for (const modulo of modulosActivos) {
  for (const [ruta, routerModulo] of modulo.rutas) router.use(ruta, routerModulo);
}

export default router;