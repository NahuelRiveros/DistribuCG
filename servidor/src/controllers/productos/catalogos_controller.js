import {
  listarCategorias, existeCategoriaConSlug, crearCategoria, actualizarCategoria, eliminarCategoria,
  listarMarcas, existeMarcaConSlug, crearMarca, actualizarMarca, eliminarMarca,
  listarTalles, crearTalle, actualizarTalle, eliminarTalle,
  listarColores, crearColor, actualizarColor, eliminarColor,
  listarOpcionesEnvio, crearOpcionEnvio, actualizarOpcionEnvio, eliminarOpcionEnvio,
  listarCondicionesIva,
} from "../../services/productos/catalogos_service.js";

// ── Categorías ───────────────────────────────────────────────────────────

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

// ── Marcas ───────────────────────────────────────────────────────────────

export async function listarMarcasController(req, res) {
  try {
    return res.json({ ok: true, data: await listarMarcas() });
  } catch (error) {
    console.error("Error al listar marcas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar marcas" });
  }
}

export async function crearMarcaController(req, res) {
  try {
    const { nombre, slug, logo, descripcion, orden } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre y slug son requeridos" });
    }
    if (await existeMarcaConSlug(slug)) {
      return res.status(409).json({ ok: false, mensaje: `Ya existe una marca con el slug "${slug}"` });
    }
    const marca = await crearMarca({ nombre: nombre.trim(), slug: slug.trim(), logo, descripcion, orden });
    return res.status(201).json({ ok: true, mensaje: "Marca creada correctamente", data: marca });
  } catch (error) {
    console.error("Error al crear marca:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear la marca" });
  }
}

export async function actualizarMarcaController(req, res) {
  try {
    const { id } = req.params;
    const { nombre, slug, logo, descripcion, orden } = req.body;
    if (!nombre?.trim() || !slug?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "nombre y slug son requeridos" });
    }
    if (await existeMarcaConSlug(slug, id)) {
      return res.status(409).json({ ok: false, mensaje: `Ya existe otra marca con el slug "${slug}"` });
    }
    const marca = await actualizarMarca(id, { nombre: nombre.trim(), slug: slug.trim(), logo, descripcion, orden });
    if (!marca) return res.status(404).json({ ok: false, mensaje: "Marca no encontrada" });
    return res.json({ ok: true, mensaje: "Marca actualizada correctamente", data: marca });
  } catch (error) {
    console.error("Error al actualizar marca:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar la marca" });
  }
}

export async function eliminarMarcaController(req, res) {
  try {
    const marca = await eliminarMarca(req.params.id);
    if (!marca) return res.status(404).json({ ok: false, mensaje: "Marca no encontrada" });
    return res.json({ ok: true, mensaje: "Marca eliminada correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar marca:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar la marca" });
  }
}

// ── Talles ───────────────────────────────────────────────────────────────

export async function listarTallesController(req, res) {
  try {
    return res.json({ ok: true, data: await listarTalles() });
  } catch (error) {
    console.error("Error al listar talles:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar talles" });
  }
}

export async function crearTalleController(req, res) {
  try {
    const { nombre, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    const talle = await crearTalle({ nombre: nombre.trim(), orden });
    return res.status(201).json({ ok: true, mensaje: "Talle creado correctamente", data: talle });
  } catch (error) {
    console.error("Error al crear talle:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear el talle" });
  }
}

export async function actualizarTalleController(req, res) {
  try {
    const { nombre, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    const talle = await actualizarTalle(req.params.id, { nombre: nombre.trim(), orden });
    if (!talle) return res.status(404).json({ ok: false, mensaje: "Talle no encontrado" });
    return res.json({ ok: true, mensaje: "Talle actualizado correctamente", data: talle });
  } catch (error) {
    console.error("Error al actualizar talle:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el talle" });
  }
}

export async function eliminarTalleController(req, res) {
  try {
    const talle = await eliminarTalle(req.params.id);
    if (!talle) return res.status(404).json({ ok: false, mensaje: "Talle no encontrado" });
    return res.json({ ok: true, mensaje: "Talle eliminado correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar talle:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el talle" });
  }
}

// ── Colores ──────────────────────────────────────────────────────────────

export async function listarColoresController(req, res) {
  try {
    return res.json({ ok: true, data: await listarColores() });
  } catch (error) {
    console.error("Error al listar colores:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar colores" });
  }
}

export async function crearColorController(req, res) {
  try {
    const { nombre, hex, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    const color = await crearColor({ nombre: nombre.trim(), hex, orden });
    return res.status(201).json({ ok: true, mensaje: "Color creado correctamente", data: color });
  } catch (error) {
    console.error("Error al crear color:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear el color" });
  }
}

export async function actualizarColorController(req, res) {
  try {
    const { nombre, hex, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: "nombre es requerido" });
    const color = await actualizarColor(req.params.id, { nombre: nombre.trim(), hex, orden });
    if (!color) return res.status(404).json({ ok: false, mensaje: "Color no encontrado" });
    return res.json({ ok: true, mensaje: "Color actualizado correctamente", data: color });
  } catch (error) {
    console.error("Error al actualizar color:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar el color" });
  }
}

export async function eliminarColorController(req, res) {
  try {
    const color = await eliminarColor(req.params.id);
    if (!color) return res.status(404).json({ ok: false, mensaje: "Color no encontrado" });
    return res.json({ ok: true, mensaje: "Color eliminado correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar color:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar el color" });
  }
}

// ── Opciones de envío ────────────────────────────────────────────────────

export async function listarOpcionesEnvioController(req, res) {
  try {
    return res.json({ ok: true, data: await listarOpcionesEnvio() });
  } catch (error) {
    console.error("Error al listar opciones de envío:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar opciones de envío" });
  }
}

export async function crearOpcionEnvioController(req, res) {
  try {
    const { nombre, descripcion, precio, tiempo_estimado, gratis_desde } = req.body;
    if (!nombre?.trim() || precio === undefined) {
      return res.status(400).json({ ok: false, mensaje: "nombre y precio son requeridos" });
    }
    const opcion = await crearOpcionEnvio({ nombre: nombre.trim(), descripcion, precio, tiempo_estimado, gratis_desde });
    return res.status(201).json({ ok: true, mensaje: "Opción de envío creada correctamente", data: opcion });
  } catch (error) {
    console.error("Error al crear opción de envío:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear la opción de envío" });
  }
}

export async function actualizarOpcionEnvioController(req, res) {
  try {
    const { nombre, descripcion, precio, tiempo_estimado, gratis_desde } = req.body;
    if (!nombre?.trim() || precio === undefined) {
      return res.status(400).json({ ok: false, mensaje: "nombre y precio son requeridos" });
    }
    const opcion = await actualizarOpcionEnvio(req.params.id, { nombre: nombre.trim(), descripcion, precio, tiempo_estimado, gratis_desde });
    if (!opcion) return res.status(404).json({ ok: false, mensaje: "Opción de envío no encontrada" });
    return res.json({ ok: true, mensaje: "Opción de envío actualizada correctamente", data: opcion });
  } catch (error) {
    console.error("Error al actualizar opción de envío:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar la opción de envío" });
  }
}

export async function eliminarOpcionEnvioController(req, res) {
  try {
    const opcion = await eliminarOpcionEnvio(req.params.id);
    if (!opcion) return res.status(404).json({ ok: false, mensaje: "Opción de envío no encontrada" });
    return res.json({ ok: true, mensaje: "Opción de envío eliminada correctamente", data: null });
  } catch (error) {
    console.error("Error al eliminar opción de envío:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al eliminar la opción de envío" });
  }
}

// ── Condiciones IVA ──────────────────────────────────────────────────────

export async function listarCondicionesIvaController(req, res) {
  try {
    return res.json({ ok: true, data: await listarCondicionesIva() });
  } catch (error) {
    console.error("Error al listar condiciones IVA:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar condiciones IVA" });
  }
}
