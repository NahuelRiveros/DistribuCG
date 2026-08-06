export const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export const DIA_LABEL = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};

// getDay(): 0=domingo, 1=lunes, ... 6=sábado
const DIA_POR_INDICE = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export function diaSemanaDeFecha(fecha) {
  return DIA_POR_INDICE[new Date(`${fecha}T00:00:00`).getDay()];
}

// Fecha local (YYYY-MM-DD) del día calendario más reciente (hoy o hacia
// atrás) que cae en ese día de la semana — para sugerir una fecha al
// registrar una sesión desde la celda de un día puntual de la matriz
// (si hoy es jueves y tocás "agregar sesión" en la fila de Lunes, tiene
// más sentido sugerir el lunes de esta semana que el día de hoy).
export function fechaRecienteParaDia(diaSemana) {
  const objetivo = DIA_POR_INDICE.indexOf(diaSemana);
  if (objetivo === -1) return null;
  const fecha = new Date();
  const diff = (fecha.getDay() - objetivo + 7) % 7;
  fecha.setDate(fecha.getDate() - diff);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
