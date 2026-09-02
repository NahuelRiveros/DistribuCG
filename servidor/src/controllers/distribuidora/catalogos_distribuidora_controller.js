import {
  listarCategorias, existeCategoriaConSlug, crearCategoria, actualizarCategoria, eliminarCategoria,
} from "../../services/distribuidora/catalogos_distribuidora_service.js";

export async function listarCategoriasController(req, res) {
  try {
    return res.json({ ok: true, data: await listarCategorias() });
  } catch (error) {
    console.error("Error al listar categorías:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar categorías" });
  }
}

export async function crearCategoriaController(req, res) {
  try {
    const { nombre, slug, padre_id } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre y slug son requeridos" });
    }
    if (await existeCategoriaConSlug(slug)) {
      return res.status(409).json({ ok: false, mensaje: `Ya existe una categoría con el slug "${slug}"` });
    }
    const categoria = await crearCategoria({ nombre: nombre.trim(), slug: slug.trim(), padre_id: padre_id ?? null });
    return res.status(201).json({ ok: true, mensaje: "Categoría creada correctamente", data: categoria });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear la categoría" });
  }
}

export async function actualizarCategoriaController(req, res) {
  try {
    const { id } = req.params;
    const { nombre, slug, padre_id } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre y slug son requeridos" });
    }
    if (await existeCategoriaConSlug(slug, id)) {
      return res.status(409).json({ ok: false, mensaje: `Ya existe otra categoría con el slug "${slug}"` });
    }
    const categoria = await actualizarCategoria(id, { nombre: nombre.trim(), slug: slug.trim(), padre_id: padre_id ?? null });
    if (!categoria) return res.status(404).json({ ok: false, mensaje: "Categoría no encontrada" });
    return res.json({ ok: true, mensaje: "Categoría actualizada correctamente", data: categoria });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar la categoría" });
  }
}

export async function eliminarCategoriaController(req, res) {
  try {
    const { id } = req.params;
    const resultado = await eliminarCategoria(id);
    if (!resultado.ok && resultado.motivo === "no_encontrada") {
      return res.status(404).json({ ok: false, mensaje: "Categoría no encontrada" });
    }
    if (!resultado.ok && resultado.motivo === "en_uso") {
      return res.status(400).json({
        ok: false,
        mensaje: `No se puede eliminar: hay ${resultado.cantidad} producto(s) asignado(s) a esta categoría`,
      });
    }
    return res.json({ ok: true, mensaje: "Categoría eliminada correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar la categoría" });
  }
}
