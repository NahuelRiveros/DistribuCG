import { Router } from "express";
import { proyecto } from "compartido/proyecto.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { env } from "../../nucleo/env.js";

export const saludRutas = Router();

// Para monitoreo (Render) y para el test de humo de Playwright.
saludRutas.get("/", async (_req, res) => {
  await sequelize.query("SELECT 1");
  res.json({ ok: true, data: { estado: "ok", base_de_datos: "ok", imagenes: env.imagenesConfiguradas ? "cloudinary" : "solo_url", modulos: proyecto.modulos } });
});
