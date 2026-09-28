// Traído de DistribuCG (services/common/query_helpers.js).
import { Op } from "sequelize";

/** Deja solo las claves permitidas (evita que el cliente escriba campos que no debe). */
export function pick(obj = {}, campos = []) {
  const salida = {};
  for (const campo of campos) {
    if (obj[campo] !== undefined) salida[campo] = obj[campo];
  }
  return salida;
}

/** Patrón ILIKE "contiene": escapa % y _ para que se busquen como texto, no como comodines. */
export function patronContiene(q) {
  return `%${String(q ?? "").trim().replace(/[\\%_]/g, "\\$&")}%`;
}

/** WHERE de búsqueda ILIKE sobre los campos permitidos. Devuelve null si no hay texto. */
export function armarBusquedaTexto(campos = [], q) {
  const texto = String(q ?? "").trim();
  if (!texto || campos.length === 0) return null;
  const patron = patronContiene(texto);
  return { [Op.or]: campos.map((campo) => ({ [campo]: { [Op.iLike]: patron } })) };
}
