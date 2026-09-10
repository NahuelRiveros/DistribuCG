import { orderConfig } from "../../../config/order_config.js";
export { ESTADOS, ESTADOS_PAGO } from "../../../config/order_config.js";
export const ESTADOS_QUE_REQUIEREN_PAGO = orderConfig.paymentRequiredStates;
export function requierePagoParaEstado(estado) { return ESTADOS_QUE_REQUIEREN_PAGO.includes(estado); }
