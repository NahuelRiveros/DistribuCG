import { useState, useRef, useEffect, useCallback } from "react";
import { readGuestCart, guestItem, mergeGuestItems } from "./guest_storage.js";
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
    return () => { active.current = false; };
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
  const setCantidad = useCallback((id, quantity) => enqueue(async () => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > config.maxQuantity) throw new Error("Cantidad inválida.");
    setError("");
    if (userId && ready.current) return publish(await adapter.update(id, quantity));
    saveGuest(itemsRef.current.map((i) => i.item_id === id ? { ...i, cantidad: quantity } : i));
  }), [adapter, config, enqueue, publish, saveGuest, userId]);
  const removeItem = useCallback((id) => enqueue(async () => {
    setError("");
    if (userId && ready.current) return publish(await adapter.remove(id));
    saveGuest(itemsRef.current.filter((i) => i.item_id !== id));
  }), [adapter, enqueue, publish, saveGuest, userId]);
  const clearCart = useCallback(() => enqueue(async () => {
    if (userId && ready.current) { await adapter.clear(); publish([]); }
    else saveGuest([]);
    setError("");
  }), [adapter, enqueue, publish, saveGuest, userId]);
  const flush = useCallback(async () => {
    await queue.current;
    if (userId && !ready.current) throw new Error("Primero recuperá o corregí tu carrito guardado.");
    return itemsRef.current;
  }, [userId]);
  return { items, loading, error, pending, addItem, setCantidad, removeItem, clearCart, recargar, flush,
    cantidadItems: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + Math.round(i.precio * 100) * i.cantidad, 0) / 100,
  };
}
