import { clientConfig } from "../../../client_config.js";
import { projectModules } from "./gate_config.js";
export const storefrontConfig = {
  ...clientConfig.distribuidora, enabled: projectModules.eccomerce_distribuidora,
  storageKey: `${clientConfig.id}:distribuidora:guest:v1`,
  catalogPath: "/distribuidora/catalogo", cartPath: "/distribuidora/carrito", ordersPath: "/distribuidora/mis-pedidos", profilePath: "/perfil",
  labels: {
    title: "Productos", search: "Buscar por producto, marca o código", availability: "Disponibilidad a confirmar",
    checkout: "Continuar con el pedido", confirmation: "Enviar pedido",
    orderNotice: "El envío del pedido no realiza un cobro. Nuestro equipo confirma disponibilidad, entrega y forma de pago.",
    priceNotice: "Precios con IVA. La entrega se coordina al confirmar el pedido.",
  },
};
