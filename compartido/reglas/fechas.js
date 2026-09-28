// Fechas "de calendario" (sin hora) como texto AAAA-MM-DD: es lo que guarda la base
// (DATEONLY) y lo que usa un <input type="date">, y evita corrimientos por zona horaria.
import { proyecto } from "../proyecto.js";

export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
// La semana arranca el lunes, como en los calendarios de Argentina.
export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const dosDigitos = (n) => String(n).padStart(2, "0");

/** "2026-09-28" para el día de hoy en la zona horaria del negocio (no la del servidor). */
export function hoyEn(zona = proyecto.zona_horaria, ahora = new Date()) {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

export function fechaTexto(anio, mes, dia) {
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`;
}

/** true si es una fecha AAAA-MM-DD que existe (rechaza 2026-02-30). */
export function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto ?? ""))) return false;
  const [anio, mes, dia] = texto.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export function diasDelMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Columna (0 = lunes … 6 = domingo) del primer día del mes, para armar la grilla. */
export function columnaPrimerDia(anio, mes) {
  return (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
}

/** "Lunes 28 de septiembre" */
export function fechaLarga(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const nombreDia = new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString("es-AR", { weekday: "long", timeZone: "UTC" });
  return `${nombreDia.charAt(0).toUpperCase()}${nombreDia.slice(1)} ${dia} de ${MESES[mes - 1].toLowerCase()}`;
}
