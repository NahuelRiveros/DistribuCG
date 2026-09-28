import { Router } from "express";
import { idParams } from "compartido/schemas/comunes.js";
import {
  ajustePreciosSchema,
  categoriaSchema,
  claveProductoParams,
  estadoProductoSchema,
  imagenParams,
  imagenUrlSchema,
  listarProductosQuery,
  ordenImagenesSchema,
  productoSchema,
} from "compartido/schemas/catalogo.js";
import { authOpcional, requerirAuth, requerirModulo, requerirRol } from "../../nucleo/auth/middlewares.js";
import { recibirArchivo } from "../../nucleo/archivos.js";
import { validar } from "../../nucleo/validar.js";
import { cachePublico } from "../../nucleo/cache.js";
import { GESTORES_CATALOGO } from "./permisos.js";
import * as categorias from "./categoria_controlador.js";
import * as productos from "./producto_controlador.js";
import * as imagenes from "./imagen_controlador.js";
import * as precios from "./precios_controlador.js";
import { importacionRutas } from "./importacion/importacion_rutas.js";

const gestor = [requerirAuth, requerirRol(...GESTORES_CATALOGO)];

export const catalogoRutas = Router();
catalogoRutas.use(requerirModulo("catalogo"));

// ── Categorías ──
catalogoRutas.get("/categorias", cachePublico(), authOpcional, categorias.listar);
catalogoRutas.post("/categorias", ...gestor, validar({ body: categoriaSchema }), categorias.crear);
catalogoRutas.put("/categorias/:id", ...gestor, validar({ params: idParams, body: categoriaSchema }), categorias.actualizar);
catalogoRutas.delete("/categorias/:id", ...gestor, validar({ params: idParams }), categorias.eliminar);

// ── Productos ──
catalogoRutas.get("/productos", cachePublico(), authOpcional, validar({ query: listarProductosQuery }), productos.listar);
catalogoRutas.get("/productos/:clave", cachePublico(), authOpcional, validar({ params: claveProductoParams }), productos.obtener);
catalogoRutas.post("/productos", ...gestor, validar({ body: productoSchema }), productos.crear);
catalogoRutas.put("/productos/:id", ...gestor, validar({ params: idParams, body: productoSchema }), productos.actualizar);
catalogoRutas.patch("/productos/:id/estado", ...gestor, validar({ params: idParams, body: estadoProductoSchema }), productos.cambiarEstado);
catalogoRutas.delete("/productos/:id", requerirAuth, requerirRol("admin"), validar({ params: idParams }), productos.eliminar);

// ── Imágenes de producto ──
const archivoImagen = recibirArchivo({
  campo: "imagen",
  maxMb: 5,
  extensiones: [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"],
  mensajeTipo: "Solo se aceptan imágenes JPG, PNG, WEBP, AVIF o GIF.",
});
catalogoRutas.post("/productos/:id/imagenes", ...gestor, validar({ params: idParams }), archivoImagen, imagenes.subir);
catalogoRutas.post("/productos/:id/imagenes/url", ...gestor, validar({ params: idParams, body: imagenUrlSchema }), imagenes.agregarPorUrl);
catalogoRutas.put("/productos/:id/imagenes/orden", ...gestor, validar({ params: idParams, body: ordenImagenesSchema }), imagenes.ordenar);
catalogoRutas.delete("/productos/:id/imagenes/:imagenId", ...gestor, validar({ params: imagenParams }), imagenes.eliminar);

// ── Precios ──
catalogoRutas.post("/precios/ajuste", ...gestor, validar({ body: ajustePreciosSchema }), precios.ajustar);

// ── Importación desde Excel/CSV ──
catalogoRutas.use("/importacion", ...gestor, importacionRutas);
