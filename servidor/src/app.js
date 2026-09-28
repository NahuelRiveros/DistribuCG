import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { proyecto } from "compartido/proyecto.js";
import { env } from "./nucleo/env.js";
import { manejadorErrores, rutaNoEncontrada } from "./nucleo/manejador_errores.js";
import { rutasDeModulos } from "./modulos/registro.js";

// Vite usa el siguiente puerto libre si 5173 está ocupado.
const ORIGENES_DESARROLLO = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];

export function crearApp() {
  const app = express();
  const origenes = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((o) => o.trim()) : ORIGENES_DESARROLLO;

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // detrás del proxy de Render: IP real para el rate limit
  app.use(helmet());
  app.use(compression());
  if (!env.esTest) app.use(morgan(env.esProduccion ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      // Sin origin = curl, Postman o el mismo servidor.
      origin: (origin, callback) => callback(null, !origin || origenes.includes(origin)),
    }),
  );

  const api = express.Router();
  for (const { prefijo, rutas, modulo } of rutasDeModulos) {
    if (modulo === null || proyecto.modulos[modulo]) api.use(prefijo, rutas);
  }
  api.use(rutaNoEncontrada);

  app.use("/api", api);
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}
