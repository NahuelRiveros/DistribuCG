import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../auth/auth_context.jsx";
import { projectModules } from "../../../config/gate_config.js";
import {
  getCarrito, addCarritoItem, updateCarritoItem, removeCarritoItem, clearCarrito,
} from "../api/carrito_distribuidora_api.js";
// Validaciones genéricas de controls/ (sin nada de indumentaria adentro) —
// no es cruzar de vertical, es lo que controls/ existe para dar. La API y el
// contexto en sí quedan acá, propios de este módulo (ver eccomerce_distribuidora
// vs eccomerce_indumentaria en la memoria del proyecto: verticales separadas).
import { sanitizarCantidad } from "../../../controls/carrito/validations/cart_validators.js";
import { detectarAlertas, alertasVacias } from "../../../controls/carrito/validations/cart_staleness.js";

const CarritoDistribuidoraContext = createContext(null);

// Seguro de montar siempre — no pega contra el backend si el módulo no está
// habilitado (mismo criterio que CartProvider de eccomerce_indumentaria).
export function CarritoDistribuidoraProvider({ children }) {
  const { isAuth } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState(alertasVacias());

  const procesarCarrito = useCallback((data) => {
    const alertasDetectadas = detectarAlertas(data);
    const itemsActivos = data.filter((i) => i.activo !== false);
    setItems(itemsActivos);
    setAlertas(alertasDetectadas);

    if (alertasDetectadas.removidos.length > 0) {
      Promise.all(
        alertasDetectadas.removidos.map((r) => removeCarritoItem(r.item_id).catch(() => {}))
      );
    }
  }, []);

  useEffect(() => {
    if (!isAuth || !projectModules.eccomerce_distribuidora) {
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

  const addItem = useCallback(async ({ producto_id, variedad_id = null, cantidad = 1 }) => {
    if (!isAuth) return;
    const cantidadValida = sanitizarCantidad(cantidad);
    const updated = await addCarritoItem({ producto_id, variedad_id, cantidad: cantidadValida });
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
    <CarritoDistribuidoraContext.Provider value={{
      items, cantidadItems, total, loading, alertas,
      addItem, removeItem, setCantidad, clearCart, limpiarAlertas, recargar,
    }}>
      {children}
    </CarritoDistribuidoraContext.Provider>
  );
}

export function useCarritoDistribuidora() {
  const ctx = useContext(CarritoDistribuidoraContext);
  if (!ctx) throw new Error("useCarritoDistribuidora debe usarse dentro de CarritoDistribuidoraProvider");
  return ctx;
}
