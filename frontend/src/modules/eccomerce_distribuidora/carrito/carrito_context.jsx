/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { useAuth } from "../../../auth/auth_context.jsx";
import { usePersistentCart } from "../../../controls/carrito/use_persistent_cart.js";
import { detectarAlertas } from "../../../controls/carrito/validations/cart_staleness.js";
import { storefrontConfig } from "../../../config/storefront_config.js";
import { getProducto } from "../api/producto_distribuidora_api.js";
import { getCarrito, addCarritoItem, updateCarritoItem, removeCarritoItem, clearCarrito, mergeCarrito } from "../api/carrito_distribuidora_api.js";
const Context = createContext(null);
const adapter = { get: getCarrito, add: addCarritoItem, update: updateCarritoItem, remove: removeCarritoItem, clear: clearCarrito, merge: mergeCarrito, product: (id) => getProducto(id, { publicAccess: storefrontConfig.publicCatalog }) };
function Engine({ userId, children }) {
  const cart = usePersistentCart({ userId, enabled: storefrontConfig.enabled, config: storefrontConfig, adapter });
  const alertas = useMemo(() => detectarAlertas(cart.items), [cart.items]);
  return <Context.Provider value={{ ...cart, alertas }}>{children}</Context.Provider>;
}
export function CarritoDistribuidoraProvider({ children }) {
  const { usuario } = useAuth();
  const id = usuario?.usuario_id ?? null;
  return <Engine key={id ?? "guest"} userId={id}>{children}</Engine>;
}
export function useCarritoDistribuidora() { const c = useContext(Context); if (!c) throw new Error("Falta CarritoDistribuidoraProvider"); return c; }
