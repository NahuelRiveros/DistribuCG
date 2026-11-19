import { estadoCatalogo, copiaCatalogo, limpiarCatalogo, cargarLote } from "../services/mantenimiento_catalogo_service.js";

const accion = (fn) => async (req, res) => {
  try { res.json({ ok: true, data: await fn(req) }); }
  catch (e) {
    if (!e.status || e.status >= 500) console.error("Mantenimiento del catálogo:", e.name, e.message);
    res.status(e.status || 500).json({ ok: false, mensaje: e.status ? e.message : "No se pudo completar. No se cambió nada: reintentá." });
  }
};

export const estadoCatalogoController = accion(() => estadoCatalogo());
export const limpiarCatalogoController = accion((req) => limpiarCatalogo(req.user.usuario_id, req.body?.confirmacion));
export const cargarLoteController = accion((req) => cargarLote(req.user.usuario_id, req.body?.lote));

export async function copiaCatalogoController(_req, res) {
  try {
    const filas = await copiaCatalogo();
    const celda = (v) => {
      let s = String(v ?? "");
      if (/^\s*[=+@-]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const columnas = ["codigo", "articulo", "presentacion", "familia", "categoria", "marca", "precio", "precio_anterior", "bulto", "activo", "foto"];
    const csv = "﻿" + [columnas.join(";"), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(";"))].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="copia-catalogo-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error("Copia del catálogo:", e.name, e.message);
    res.status(500).json({ ok: false, mensaje: "No se pudo armar la copia." });
  }
}
