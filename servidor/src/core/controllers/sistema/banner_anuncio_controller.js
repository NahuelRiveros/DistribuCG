import {
  listarBannerPublico, listarBannerAdmin, crearBannerAnuncio,
  actualizarBannerAnuncio, cambiarEstadoBannerAnuncio, eliminarBannerAnuncio,
} from "../../services/sistema/banner_anuncio_service.js";

export async function listarBannerPublicoController(_req, res) {
  try {
    const data = await listarBannerPublico();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error al listar la cinta de anuncios:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar los anuncios" });
  }
}

export async function listarBannerAdminController(_req, res) {
  try {
    const data = await listarBannerAdmin();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error al listar anuncios (admin):", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar los anuncios" });
  }
}

export async function crearBannerAnuncioController(req, res) {
  try {
    const r = await crearBannerAnuncio(req.body ?? {});
    if (!r.ok) return res.status(r.codigo === "TOPE_ALCANZADO" ? 409 : 400).json(r);
    return res.status(201).json(r);
  } catch (error) {
    console.error("Error al crear anuncio:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear el anuncio" });
  }
}

export async function actualizarBannerAnuncioController(req, res) {
  try {
    const r = await actualizarBannerAnuncio(req.params.id, req.body ?? {});
    if (!r.ok) return res.status(r.codigo === "NO_EXISTE" ? 404 : 400).json(r);
    return res.json(r);
  } catch (error) {
    console.error("Error al actualizar anuncio:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el anuncio" });
  }
}

export async function cambiarEstadoBannerAnuncioController(req, res) {
  try {
    const { activo } = req.body ?? {};
    if (typeof activo !== "boolean") return res.status(400).json({ ok: false, mensaje: "El campo activo debe ser booleano" });
    const r = await cambiarEstadoBannerAnuncio(req.params.id, activo);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (error) {
    console.error("Error al cambiar estado del anuncio:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al cambiar el estado" });
  }
}

export async function eliminarBannerAnuncioController(req, res) {
  try {
    const r = await eliminarBannerAnuncio(req.params.id);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (error) {
    console.error("Error al eliminar anuncio:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el anuncio" });
  }
}
