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
  // Solo la tienda (URL_FRONTEND_VERCEL) puede usar la API desde un navegador; en tu PC, Vite.
  const origenes = env.origenesPermitidos.length ? env.origenesPermitidos : ORIGENES_DESARROLLO;
  // A la vista en los logs de Render: si la tienda no puede usar la API, lo primero es mirar esto.
  if (!env.esTest) console.log(`🌐 Tienda permitida (URL_FRONTEND_VERCEL): ${origenes.join(", ")}`);
  const rechazados = new Set();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // detrás del proxy de Render: IP real para el rate limit
  app.use(helmet());
  app.use(compression());
  // Sin registrar los chequeos de salud de Render (uno cada pocos segundos: solo ruido en los logs).
  if (!env.esTest) app.use(morgan(env.esProduccion ? "combined" : "dev", { skip: (req) => req.originalUrl.startsWith("/api/salud") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      // Sin origin = curl, Postman o el mismo servidor.
      origin: (origin, callback) => {
        const permitido = !origin || origenes.includes(origin);
        // Una vez por dirección: el navegador solo dice "CORS"; acá queda cuál fue y qué corregir.
        if (!permitido && !env.esTest && !rechazados.has(origin)) {
          rechazados.add(origin);
          console.warn(`⚠️  Pedido desde ${origin} rechazado: no está en URL_FRONTEND_VERCEL (${origenes.join(", ") || "vacía"}).`);
        }
        callback(null, permitido);
      },
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
