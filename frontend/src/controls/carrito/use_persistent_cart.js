import { useState, useRef, useEffect, useCallback } from "react";
import { readGuestCart, guestItem, mergeGuestItems } from "./guest_storage.js";

// Cuántos ms esperar tras el último click sobre la MISMA línea antes de
// mandar el PUT — varios clicks seguidos de +/- terminan en un solo request
// con la cantidad final, no uno por click.
const DEBOUNCE_MS = 400;

// Contrato de adapter: get, add, update, remove, clear, merge, product.
// El provider que lo consume debe remontar por identidad de cuenta.
export function usePersistentCart({ userId, enabled, config, adapter }) {
  const [items, setItems] = useState(() => enabled ? readGuestCart(localStorage, config.storageKey, config.cartTtlDays)?.items ?? [] : []);
  const [loading, setLoading] = useState(!!userId && enabled);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const itemsRef = useRef(items);
  const queue = useRef(Promise.resolve());
  const active = useRef(true);
  const ready = useRef(!userId);
  // item_id → { timeoutId, quantity, original } — cantidades optimistas
  // todavía no confirmadas contra el servidor (ver setCantidad/commit).
  const timers = useRef({});
  const publish = useCallback((data) => { if (active.current) { itemsRef.current = data; setItems(data); } }, []);
  const saveGuest = useCallback((data) => {
    if (!active.current) throw new Error("La sesión cambió. Volvé a intentar.");
    localStorage.setItem(config.storageKey, JSON.stringify({ key: crypto.randomUUID(), updatedAt: Date.now(), items: data }));
    publish(data);
  }, [config, publish]);
  const enqueue = useCallback((action) => {
    setPending((n) => n + 1);
    const operation = queue.current.then(() => { if (!active.current) throw new Error("La sesión cambió."); return action(); });
    queue.current = operation.catch(() => {});
    return operation.catch((e) => { if (active.current) setError(e.response?.data?.mensaje || e.message || "No pudimos guardar tu carrito."); throw e; })
      .finally(() => { if (active.current) setPending((n) => n - 1); });
  }, []);
  // Envía al servidor la cantidad optimista pendiente de una línea (si la
  // hay) y limpia su timer — lo dispara tanto el debounce natural como
  // flush() (checkout no puede avanzar con cambios todavía sin confirmar).
  const commit = useCallback((id) => {
    const t = timers.current[id];
    if (!t) return Promise.resolve(itemsRef.current);
    clearTimeout(t.timeoutId);
    delete timers.current[id];
    if (active.current) setPending((n) => n - 1);
    return enqueue(async () => {
      // La línea se borró (o el carrito se vació) mientras esperaba el debounce.
      if (!itemsRef.current.some((i) => i.item_id === id)) return itemsRef.current;
      try {
        return publish(await adapter.update(id, t.quantity));
      } catch (e) {
        // Rollback: si el servidor rechaza (sin stock, variante de baja, etc.)
        // volvemos a la última cantidad confirmada en vez de dejar la UI
        // mostrando un número que en realidad no se guardó.
        publish(itemsRef.current.map((i) => (i.item_id === id ? { ...i, cantidad: t.original } : i)));
        throw e;
      }
    });
  }, [adapter, enqueue, publish]);
  const recargar = useCallback(() => enqueue(async () => {
    if (!enabled) return itemsRef.current;
    setError("");
    if (!userId) return itemsRef.current;
    const guest = readGuestCart(localStorage, config.storageKey, config.cartTtlDays);
    let data;
    if (guest?.items.length) {
      data = await adapter.merge({ key: guest.key, items: guest.items.map(({ producto_id, variedad_id, cantidad }) => ({ producto_id, variedad_id, cantidad })) });
      // No borrar un borrador modificado desde otra pestaña mientras se enviaba.
      if (readGuestCart(localStorage, config.storageKey, config.cartTtlDays)?.key === guest.key) localStorage.removeItem(config.storageKey);
    } else data = await adapter.get();
    ready.current = true;
    publish(data);
    return data;
  }), [adapter, config, enabled, enqueue, publish, userId]);
  useEffect(() => {
    active.current = true;
    if (enabled && userId) recargar().catch(() => {}).finally(() => { if (active.current) setLoading(false); });
    return () => {
      active.current = false;
      Object.values(timers.current).forEach((t) => clearTimeout(t.timeoutId));
      timers.current = {};
    };
  }, [enabled, userId, recargar]);
  const addItem = useCallback((payload) => enqueue(async () => {
    if (!enabled) throw new Error("El carrito no está disponible.");
    setError("");
    if (userId && ready.current) return publish(await adapter.add(payload));
    if (!config.guestCart || !config.publicCatalog) throw new Error("Ingresá para agregar productos.");
    const product = await adapter.product(payload.producto_id);
    const variety = product.variedades?.find((v) => v.id === payload.variedad_id);
    if (!variety) throw new Error("Esta presentación ya no está disponible.");
    saveGuest(mergeGuestItems(itemsRef.current, guestItem(product, variety, payload.cantidad ?? 1), config.maxQuantity, config.maxCartLines));
  }), [adapter, config, enabled, enqueue, publish, saveGuest, userId]);
  // Optimista: la cantidad se refleja en la UI al instante (localStorage para
  // invitados, estado en memoria para logueados) y el PUT al servidor se
  // manda debounced en segundo plano — ver DEBOUNCE_MS arriba. Si el server
  // lo rechaza, commit() revierte la línea a su última cantidad confirmada.
  const setCantidad = useCallback((id, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > config.maxQuantity) {
      const err = new Error("Cantidad inválida.");
      setError(err.message);
      return Promise.reject(err);
    }
    const actual = itemsRef.current.find((i) => i.item_id === id);
    if (!actual) return Promise.resolve(itemsRef.current);
    setError("");
    publish(itemsRef.current.map((i) => (i.item_id === id ? { ...i, cantidad: quantity } : i)));

    if (!(userId && ready.current)) {
      saveGuest(itemsRef.current);
      return Promise.resolve(itemsRef.current);
    }

    const existente = timers.current[id];
    const original = existente ? existente.original : actual.cantidad;
    if (existente) clearTimeout(existente.timeoutId);
    else setPending((n) => n + 1);
    return new Promise((resolve, reject) => {
      timers.current[id] = {
        original,
        quantity,
        timeoutId: setTimeout(() => commit(id).then(resolve, reject), DEBOUNCE_MS),
      };
    });
  }, [commit, config, publish, saveGuest, userId]);
  const removeItem = useCallback((id) => enqueue(async () => {
    setError("");
    // Una cantidad optimista todavía sin confirmar para esta línea ya no
    // aplica — se está borrando la línea entera.
    const t = timers.current[id];
    if (t) { clearTimeout(t.timeoutId); delete timers.current[id]; if (active.current) setPending((n) => n - 1); }
    if (userId && ready.current) return publish(await adapter.remove(id));
    saveGuest(itemsRef.current.filter((i) => i.item_id !== id));
  }), [adapter, enqueue, publish, saveGuest, userId]);
  const clearCart = useCallback(() => enqueue(async () => {
    Object.entries(timers.current).forEach(([id, t]) => { clearTimeout(t.timeoutId); delete timers.current[id]; if (active.current) setPending((n) => n - 1); });
    if (userId && ready.current) { await adapter.clear(); publish([]); }
    else saveGuest([]);
    setError("");
  }), [adapter, enqueue, publish, saveGuest, userId]);
  const flush = useCallback(async () => {
    // Confirma contra el servidor cualquier cantidad optimista que todavía
    // esté esperando su debounce — el checkout no puede avanzar con cambios
    // sin guardar (ver prepare() en nota_pedido_page.jsx).
    await Promise.all(Object.keys(timers.current).map((id) => commit(id)));
    await queue.current;
    if (userId && !ready.current) throw new Error("Primero recuperá o corregí tu carrito guardado.");
    return itemsRef.current;
  }, [commit, userId]);
  return { items, loading, error, pending, addItem, setCantidad, removeItem, clearCart, recargar, flush,
    cantidadItems: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + Math.round(i.precio * 100) * i.cantidad, 0) / 100,
  };
}
