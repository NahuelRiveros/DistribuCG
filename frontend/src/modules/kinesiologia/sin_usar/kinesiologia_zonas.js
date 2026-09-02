// Orden fijo de zonas para agrupar ejercicios — "Otros" (ejercicios sin
// grupo muscular asignado) siempre al final. Usado tanto por el formulario
// de registrar sesión como por el modal de configurar rutina.
export const ORDEN_ZONAS = ["Tren superior", "Tren inferior", "Core y tronco", "Otros"];

export function agruparEjerciciosPorZona(ejercicios) {
  const porZona = new Map();
  for (const ej of ejercicios) {
    const zona = ej.zona || "Otros";
    if (!porZona.has(zona)) porZona.set(zona, []);
    porZona.get(zona).push(ej);
  }
  return ORDEN_ZONAS
    .filter((zona) => porZona.has(zona))
    .map((zona) => ({ zona, ejercicios: porZona.get(zona) }));
}
