import { Router } from "express";
import { proyecto } from "compartido/proyecto.js";
import { sequelize } from "../../nucleo/db/sequelize.js";
import { env } from "../../nucleo/env.js";

export const saludRutas = Router();

// Render consulta esta ruta cada pocos segundos: por defecto NO toca la base, porque si lo hiciera
// Neon nunca se suspendería y gastaría horas de cómputo todo el día. `?bd=1` también prueba la base.
saludRutas.get("/", async (req, res) => {
  const conBase = req.query.bd === "1";
  if (conBase) await sequelize.query("SELECT 1");
  res.set("Cache-Control", "no-store");
  res.json({
    ok: true,
    data: {
      estado: "ok",
      base_de_datos: conBase ? "ok" : "sin_revisar",
      imagenes: env.imagenesConfiguradas ? "cloudinary" : "solo_url",
      modulos: proyecto.modulos,
    },
  });
});
