import { projectModules } from "./gate_config.js";
// Políticas compartidas por API y navegador; nunca incluir secretos.
export const clientConfig = {
  id: "gc",
  auth: { publicRegistration: projectModules.eccomerce_distribuidora || projectModules.eccomerce_indumentaria, passwordMinLength: 8, passwordMaxLength: 72, resetMinutes: 20 },
  distribuidora: { publicCatalog: true, guestCart: true, pageSize: 24, maxQuantity: 9999, maxCartLines: 200, cartTtlDays: 30 },
};
