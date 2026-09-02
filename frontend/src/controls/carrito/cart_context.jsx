import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/auth_context.jsx";
import { cartConfig } from "../../config/cart_config.js";
import {
  getCarrito,
  addCarritoItem,
  updateCarritoItem,
  removeCarritoItem,
  clearCarrito,
} from "./cart_api.js";
import { sanitizarCantidad } from "./validations/cart_validators.js";
import { detectarAlertas, alertasVacias } from "./validations/cart_staleness.js";

const CartContext = createContext(null);

// Seguro de montar siempre (incluso con enableCart: false) — no pega contra
// /carrito a menos que el proyecto lo tenga activado en cart_config.js.
export function CartProvider({ children }) {
  const { isAuth } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState(alertasVacias());

  const procesarCarrito = useCallback((data) => {
    const alertasDetectadas = detectarAlertas(data);

    // Filtrar items activos para la UI (productos desactivados no se muestran)
    const itemsActivos = data.filter((i) => i.activo !== false);
    setItems(itemsActivos);
    setAlertas(alertasDetectadas);

    // Auto-remover del servidor los productos desactivados (en background)
    if (alertasDetectadas.removidos.length > 0) {
      Promise.all(
        alertasDetectadas.removidos.map((r) => removeCarritoItem(r.item_id).catch(() => {}))
      );
    }
  }, []);

  // Carga el carrito del servidor al iniciar sesión (solo si el proyecto
  // tiene el carrito habilitado). Limpia el estado local al cerrar sesión.
  useEffect(() => {
    if (!isAuth || !cartConfig.enableCart) {
      setItems([]);
      setAlertas(alertasVacias());
      return;
    }
    setLoading(true);
    getCarrito()
      .then(procesarCarrito)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAuth, procesarCarrito]);

  const cantidadItems = items.reduce((s, i) => s + i.cantidad, 0);
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  // precio_unidad NO se pasa — el backend lo obtiene desde la base de datos
  const addItem = useCallback(async ({ producto_id, variante_id = null, cantidad = 1 }) => {
    if (!isAuth) return;
    const cantidadValida = sanitizarCantidad(cantidad);
    const updated = await addCarritoItem({ producto_id, variante_id, cantidad: cantidadValida });
    procesarCarrito(updated);
  }, [isAuth, procesarCarrito]);

  const removeItem = useCallback(async (item_id) => {
    if (!isAuth) return;
    const updated = await removeCarritoItem(item_id);
    procesarCarrito(updated);
  }, [isAuth, procesarCarrito]);

  const setCantidad = useCallback(async (item_id, cantidad) => {
    if (!isAuth) return;
    const cantidadValida = sanitizarCantidad(cantidad);
    if (cantidadValida <= 0) {
      removeItem(item_id);
      return;
    }
    const updated = await updateCarritoItem(item_id, cantidadValida);
    procesarCarrito(updated);
  }, [isAuth, removeItem, procesarCarrito]);

  const clearCart = useCallback(async () => {
    if (!isAuth) return;
    await clearCarrito();
    setItems([]);
    setAlertas(alertasVacias());
  }, [isAuth]);

  const limpiarAlertas = useCallback(() => {
    setAlertas(alertasVacias());
  }, []);

  const recargar = useCallback(() => {
    if (!isAuth) return;
    setLoading(true);
    getCarrito()
      .then(procesarCarrito)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuth, procesarCarrito]);

  return (
    <CartContext.Provider value={{
      items,
      cantidadItems,
      total,
      loading,
      alertas,
      addItem,
      removeItem,
      setCantidad,
      clearCart,
      limpiarAlertas,
      recargar,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
