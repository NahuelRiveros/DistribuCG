import { obtenerPerfil, guardarPerfil } from "../../services/distribuidora/perfil_cliente_service.js";

export async function obtenerMiPerfilController(req, res) {
  try {
    return res.json({ ok: true, data: await obtenerPerfil(req.user.usuario_id) });
  } catch (error) {
    console.error("Error al obtener perfil de cliente:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener el perfil" });
  }
}

export async function guardarMiPerfilController(req, res) {
  try {
    const { cuit, razon_social, condicion_iva, direccion, provincia, localidad } = req.body ?? {};
    if (!cuit?.trim() || !direccion?.trim() || !provincia?.trim() || !localidad?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "cuit, direccion, provincia y localidad son requeridos" });
    }
    const perfil = await guardarPerfil(req.user.usuario_id, {
      cuit: cuit.trim(), razon_social: razon_social?.trim() || null, condicion_iva: condicion_iva || null,
      direccion: direccion.trim(), provincia: provincia.trim(), localidad: localidad.trim(),
    });
    return res.json({ ok: true, mensaje: "Perfil guardado correctamente", data: perfil });
  } catch (error) {
    console.error("Error al guardar perfil de cliente:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al guardar el perfil" });
  }
}
