export function slugify(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Categorías en orden jerárquico (padre antes que hijo), con `profundidad`
// para poder indentar el <select> — así se distingue de un vistazo "Comestibles"
// (raíz) de "› Galletitas" (hija) de "›› Pepitos" (nieta), en vez de una lista
// plana donde no se nota quién es padre de quién.
export function aplanarJerarquia(categorias, padreId = null, profundidad = 0) {
  const hijos = categorias
    .filter((c) => c.padre_id === padreId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  return hijos.flatMap((c) => [
    { ...c, profundidad },
    ...aplanarJerarquia(categorias, c.id, profundidad + 1),
  ]);
}

export function construirOpcionesCategoria(categorias) {
  return aplanarJerarquia(categorias).map((c) => ({
    value: c.id,
    label: c.profundidad > 0 ? `${"›".repeat(c.profundidad)} ${c.nombre}` : c.nombre,
  }));
}

// Una categoría no puede ser padre de sí misma ni de ninguno de sus propios
// descendientes (crearía un ciclo) — devuelve el set de ids a excluir del
// selector de "categoría padre" al editar `categoriaEditar`.
export function idsExcluidosComoPadre(categoriaEditar, categorias) {
  if (!categoriaEditar) return new Set();
  const excluidos = new Set([categoriaEditar.id]);
  let agregado = true;
  while (agregado) {
    agregado = false;
    for (const c of categorias) {
      if (excluidos.has(c.padre_id) && !excluidos.has(c.id)) { excluidos.add(c.id); agregado = true; }
    }
  }
  return excluidos;
}
