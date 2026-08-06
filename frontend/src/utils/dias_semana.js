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
