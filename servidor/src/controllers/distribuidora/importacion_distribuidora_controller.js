import { parsearArchivo, ejecutarImportacion } from "../../services/distribuidora/importacion_distribuidora_service.js";

export async function previsualizarImportacionController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, mensaje: "Falta el archivo" });
    const { columnas, filas } = await parsearArchivo(req.file.buffer, req.file.originalname);
    if (columnas.length === 0) {
      return res.status(400).json({ ok: false, mensaje: "No se reconocieron columnas — revisá que la primera fila tenga los encabezados" });
    }
    return res.json({ ok: true, data: { columnas, filas: filas.slice(0, 10), total_filas: filas.length } });
  } catch (error) {
    console.error("Error al previsualizar importación:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo leer el archivo — confirmá que sea un .xlsx o .csv válido" });
  }
}

export async function ejecutarImportacionController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, mensaje: "Falta el archivo" });

    let mapeo;
    try {
      mapeo = JSON.parse(req.body.mapeo ?? "{}");
    } catch {
      return res.status(400).json({ ok: false, mensaje: "El mapeo de columnas es inválido" });
    }
    if (!mapeo.producto_nombre || !mapeo.precio) {
      return res.status(400).json({ ok: false, mensaje: "Falta mapear \"Nombre del producto\" y \"Precio\" — son obligatorios" });
    }

    const { filas } = await parsearArchivo(req.file.buffer, req.file.originalname);
    const resultado = await ejecutarImportacion(filas, mapeo);

    return res.json({
      ok: true,
      mensaje: `Importación completa: ${resultado.creados} creado(s), ${resultado.actualizados} actualizado(s)${resultado.errores.length ? `, ${resultado.errores.length} con error` : ""}`,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al ejecutar importación:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo completar la importación" });
  }
}
