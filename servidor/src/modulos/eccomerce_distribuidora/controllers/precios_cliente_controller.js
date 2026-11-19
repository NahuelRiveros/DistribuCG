import { once } from "node:events";
import {
  validarListaCliente, obtenerActualizacion, listarFilas, guardarDecisiones, ejecutarLote,
  cancelarActualizacion, deshacerActualizacion, historialActualizaciones, informeActualizacion,
} from "../services/precios_cliente_service.js";
import { importError } from "../services/importacion/normalize.js";

const accion = (fn) => async (req, res) => {
  try { res.json({ ok: true, data: await fn(req) }); }
  catch (e) {
    if (!e.status) console.error("Precios del cliente:", e.name, e.message);
    res.status(e.status || 500).json({ ok: false, mensaje: e.status ? e.message : "No se pudo completar. Reintentá; si persiste, volvé a subir la lista." });
  }
};
const archivo = (req) => { if (!req.file) throw importError("Seleccioná el Excel de la lista de precios."); return req.file; };

export const validarPreciosClienteController = accion((req) => validarListaCliente(archivo(req).buffer, req.file.originalname, req.body?.key, req.user.usuario_id));
export const historialPreciosClienteController = accion((req) => historialActualizaciones(req.user.usuario_id));
export const detallePreciosClienteController = accion((req) => obtenerActualizacion(req.params.id, req.user.usuario_id));
export const filasPreciosClienteController = accion((req) => listarFilas(req.params.id, req.user.usuario_id, {
  estado: req.query.estado ? String(req.query.estado) : undefined, pagina: Number(req.query.pagina ?? 1), buscar: String(req.query.buscar ?? ""),
}));
export const decisionesPreciosClienteController = accion((req) => guardarDecisiones(req.params.id, req.user.usuario_id, {
  decisiones: req.body?.decisiones ?? {}, aprobarTodos: req.body?.aprobarTodos === true,
}));
export const lotePreciosClienteController = accion((req) => ejecutarLote(req.params.id, req.user.usuario_id, {
  index: req.body?.index, confirm: req.body?.confirm === true, ajustarListas: req.body?.ajustarListas,
}));
export const cancelarPreciosClienteController = accion((req) => cancelarActualizacion(req.params.id, req.user.usuario_id));
export const deshacerPreciosClienteController = accion((req) => deshacerActualizacion(req.params.id, req.user.usuario_id));

export async function informePreciosClienteController(req, res) {
  try {
    await obtenerActualizacion(req.params.id, req.user.usuario_id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="precios-' + req.params.id + '.csv"');
    for await (const parte of informeActualizacion(req.params.id, req.user.usuario_id)) {
      if (res.destroyed) break;
      if (!res.write(parte)) await once(res, "drain");
    }
    res.end();
  } catch (error) {
    if (res.headersSent) res.destroy();
    else res.status(error.status || 500).json({ ok: false, mensaje: error.status ? error.message : "No se pudo armar el informe." });
    if (!error.status) console.error("Precios del cliente (informe):", error.name, error.message);
  }
}
