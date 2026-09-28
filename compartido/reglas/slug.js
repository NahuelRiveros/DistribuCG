import { quitarAcentos } from "./texto.js";

/** "Galletitas Dulces Ñandú 118g" → "galletitas-dulces-nandu-118g" (para URLs). */
export function slugificar(texto, largoMaximo = 80) {
  const slug = quitarAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, largoMaximo)
    .replace(/-+$/, "");
  return slug || "item";
}

/**
 * Agrega -2, -3... si el slug ya está usado.
 * `usados` = slugs existentes que empiezan igual (los busca quien llama).
 */
export function slugDisponible(base, usados) {
  const ocupados = new Set(usados);
  if (!ocupados.has(base)) return base;
  let n = 2;
  while (ocupados.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
