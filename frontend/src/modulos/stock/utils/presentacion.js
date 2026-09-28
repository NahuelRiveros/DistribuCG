// Textos y tonos que se repiten en las pantallas de stock.

export const ESTADOS_STOCK = {
  ok: { etiqueta: "OK", tono: "exito" },
  bajo: { etiqueta: "Stock bajo", tono: "aviso" },
  sin_stock: { etiqueta: "Sin stock", tono: "peligro" },
  sin_control: { etiqueta: "Sin control", tono: "neutro" },
};

export const TIPOS_MOVIMIENTO = {
  ingreso: { etiqueta: "Ingreso", tono: "exito" },
  ajuste: { etiqueta: "Ajuste", tono: "aviso" },
  importacion: { etiqueta: "Importación", tono: "info" },
  reserva: { etiqueta: "Reserva", tono: "info" },
  liberacion: { etiqueta: "Liberación", tono: "neutro" },
  venta: { etiqueta: "Venta", tono: "neutro" },
  devolucion: { etiqueta: "Devolución", tono: "exito" },
};

/** "Yerba (500 g)" */
export const nombreExistencia = (e) => (e.presentacion ? `${e.producto} (${e.presentacion})` : e.producto);

/** +5 / −3 (con signo menos tipográfico, más legible) */
export const conSigno = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
