import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  // Debounce de la petición real por item_id — el +/- de cantidad actualiza
  // la UI al instante (ver setCantidad) pero solo manda UNA petición al
  // servidor con la cantidad final tras una pausa de clicks, en vez de una
  // por click (evita ráfagas de requests y respuestas fuera de orden
  // pisándose entre sí).
  const timersRef = useRef({});
  useEffect(() => () => {
    Object.values(timersRef.current).forEach(clearTimeout);
  }, []);

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
    // Cancela un cambio de cantidad pendiente sobre este mismo ítem — ya no
    // tiene sentido mandarlo, se está borrando.
    clearTimeout(timersRef.current[item_id]);
    delete timersRef.current[item_id];

    // Optimista: desaparece de la UI al instante; si el servidor rechaza el
    // borrado, se reinserta.
    let removido;
    setItems((prev) => {
      removido = prev.find((i) => i.item_id === item_id);
      return prev.filter((i) => i.item_id !== item_id);
    });
    try {
      const updated = await removeCarritoItem(item_id);
      procesarCarrito(updated);
    } catch {
      if (removido) setItems((prev) => [...prev, removido]);
    }
  }, [isAuth, procesarCarrito]);

  const setCantidad = useCallback((item_id, cantidad) => {
    if (!isAuth) return;
    const cantidadValida = sanitizarCantidad(cantidad);
    if (cantidadValida <= 0) {
      removeItem(item_id);
      return;
    }

    // Optimista: el número cambia ya mismo en pantalla, sin esperar al
    // servidor — antes cada click de +/- quedaba "colgado" hasta que
    // volvía la respuesta completa del backend.
    setItems((prev) => prev.map((i) => (i.item_id === item_id ? { ...i, cantidad: cantidadValida } : i)));

    clearTimeout(timersRef.current[item_id]);
    timersRef.current[item_id] = setTimeout(async () => {
      try {
        const updated = await updateCarritoItem(item_id, cantidadValida);
        procesarCarrito(updated);
      } catch {
        // Falló (ej. sin stock) — resincronizamos con la verdad del servidor
        // en vez de dejar la UI mostrando una cantidad que no se guardó.
        getCarrito().then(procesarCarrito).catch(() => {});
      }
    }, 400);
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
