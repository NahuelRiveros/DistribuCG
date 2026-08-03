import {
  obtenerEstadoModulos,
  listarModulosNegocio,
  actualizarModuloNegocio,
} from "../services/modulo_negocio_service.js";

export async function estadoModulos(req, res, next) {
  try {
    const modulos = await obtenerEstadoModulos();
    return res.json({ ok: true, modulos });
  } catch (err) {
    next(err);
  }
}

export async function listaModulosNegocio(req, res, next) {
  try {
    const r = await listarModulosNegocio();
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function actualizarModuloNegocioController(req, res, next) {
  try {
    const { codigo } = req.params;
    const { habilitado } = req.body ?? {};
    if (typeof habilitado !== "boolean") {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "habilitado debe ser booleano" });
    }
    const r = await actualizarModuloNegocio(codigo, habilitado);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}
