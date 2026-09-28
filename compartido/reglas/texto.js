/** "Almacén Ñandú" → "Almacen Nandu" (separa letra y acento con NFD y quita los acentos). */
export function quitarAcentos(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
