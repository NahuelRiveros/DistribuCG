// Medios de pago, descuentos, cuotas y promociones (config en proyecto.config.js → pagos).
// Las usan el servidor (descuento real del pedido) y la tienda (lo que se muestra),
// así lo que ve el cliente es exactamente lo que se cobra.
import { proyecto } from "../proyecto.js";
import { aCentavos, desdeCentavos } from "./dinero.js";

// Cada función recibe la config de pagos. La vigente se edita en el panel (Configuración → Pagos)
// y se guarda en la base; proyecto.pagos son los valores iniciales (y los que usan los tests).
const PAGOS = proyecto.pagos;

/** Logos disponibles (imágenes en frontend/src/assets/medios_pago). */
export const LOGOS_MEDIOS = ["visa", "mastercard", "cabal", "naranja_x", "mercado_pago", "go_cuotas"];

/** Medios base: los usan los cobros y la Caja, así que desde el panel se editan pero no se crean. */
export const MEDIOS_BASE = proyecto.pagos.medios.map((m) => m.valor);

const activo = (item) => item.activo !== false;

/** Opciones de financiación con sus planes activos (las que quedan sin planes no se muestran). */
export const financiacionActiva = (pagos = PAGOS) =>
  pagos.financiacion.map((o) => ({ ...o, planes: o.planes.filter(activo) })).filter((o) => o.planes.length > 0);

/** Medios que el cliente puede elegir al confirmar el pedido. */
export const mediosTienda = (pagos = PAGOS) => pagos.medios.filter((m) => m.en_tienda);

export const medioPorValor = (valor, pagos = PAGOS) => pagos.medios.find((m) => m.valor === valor) ?? null;

/** % de descuento del medio (0 si no tiene o no existe). */
export const descuentoDe = (valor, pagos = PAGOS) => medioPorValor(valor, pagos)?.descuento ?? 0;

/** Aplica un % a un importe en pesos, redondeando una sola vez en centavos. */
export function conDescuento(importe, porcentaje) {
  const centavos = aCentavos(importe);
  const descuento = Math.round((centavos * porcentaje) / 100);
  return { descuento: desdeCentavos(descuento), total: desdeCentavos(centavos - descuento) };
}

/** Total del pedido con el descuento del medio elegido: { descuento, total, porcentaje }. */
export function totalConMedio(total, medio, pagos = PAGOS) {
  const porcentaje = descuentoDe(medio, pagos);
  return { ...conDescuento(total, porcentaje), porcentaje };
}

/** El medio con mayor descuento (para destacar "X% OFF con transferencia"), o null. */
export function mejorDescuento(pagos = PAGOS) {
  const conDesc = mediosTienda(pagos).filter((m) => m.descuento > 0).sort((a, b) => b.descuento - a.descuento);
  return conDesc[0] ?? null;
}

/** Valor de cada cuota y total financiado de un plan: interes es % de recargo sobre el precio. */
export function cuotasDe(precio, plan) {
  const totalCentavos = Math.round(aCentavos(precio) * (1 + plan.interes / 100));
  return { cuotas: plan.cuotas, valor_cuota: desdeCentavos(Math.round(totalCentavos / plan.cuotas)), total: desdeCentavos(totalCentavos), sin_interes: plan.interes === 0 };
}

/** La mayor cantidad de cuotas sin interés disponible, con el valor de cada una: { cuotas, valor_cuota, opcion } o null. */
export function mejorCuotaSinInteres(precio, pagos = PAGOS) {
  let mejor = null;
  for (const opcion of financiacionActiva(pagos)) {
    for (const plan of opcion.planes) {
      if (plan.interes === 0 && (!mejor || plan.cuotas > mejor.cuotas)) mejor = { ...cuotasDe(precio, plan), opcion: opcion.nombre };
    }
  }
  return mejor;
}

/** Promociones que no vencieron (hasta >= hoy), marcando si aplican hoy según el día de la semana. */
export function promocionesVigentes(hoy, pagos = PAGOS) {
  const [anio, mes, dia] = hoy.split("-").map(Number);
  const nombreDia = new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString("es-AR", { weekday: "long", timeZone: "UTC" });
  return pagos.promociones
    .filter((p) => activo(p) && (!p.hasta || p.hasta >= hoy))
    .map((p) => ({ ...p, dias: p.dias ?? [], hoy: !p.dias?.length || p.dias.includes(nombreDia) }));
}

/** Línea corta para destacar en la ficha: la cinta configurada o una armada con lo mejor disponible. */
export function cintaDestacada(pagos = PAGOS) {
  if (pagos.cinta) return pagos.cinta;
  const cuotas = financiacionActiva(pagos).flatMap((o) => o.planes).filter((p) => p.interes === 0).reduce((max, p) => Math.max(max, p.cuotas), 0);
  const descuento = mejorDescuento(pagos);
  const partes = [];
  if (cuotas > 1) partes.push(`Llevátelo en hasta ${cuotas} cuotas sin interés`);
  if (descuento) partes.push(`${partes.length ? "o con " : "Llevátelo con "}${descuento.descuento}% OFF pagando con ${descuento.etiqueta.toLowerCase()}`);
  return partes.length ? `¡${partes.join(" ")}!` : null;
}
