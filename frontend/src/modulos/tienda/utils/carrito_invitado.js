import { proyecto } from "compartido/proyecto.js";

// Carrito del visitante (sin cuenta), guardado en este navegador. Adaptado de DistribuCG
// (guest_storage.js). Guarda solo { variante_id, cantidad }: precios y stock siempre
// se consultan al servidor. `clave` identifica la fusión con la cuenta al iniciar sesión
// (si se reintenta, el servidor no suma dos veces).

const CLAVE = `${proyecto.cliente}:carrito_invitado:v1`;
const VACIO = { clave: null, items: [] };

export function leerCarritoInvitado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (!guardado || !Array.isArray(guardado.items)) return VACIO;
    const items = guardado.items.filter((i) => Number.isInteger(i?.variante_id) && Number.isInteger(i?.cantidad) && i.cantidad > 0);
    return { clave: guardado.clave ?? null, items };
  } catch {
    return VACIO; // navegador sin almacenamiento o dato roto: carrito vacío
  }
}

export function guardarCarritoInvitado(items) {
  try {
    const actual = leerCarritoInvitado();
    localStorage.setItem(CLAVE, JSON.stringify({ clave: actual.clave ?? crypto.randomUUID(), items }));
  } catch {
    // Sin almacenamiento el carrito dura lo que dure la pestaña; no es un error para el usuario.
  }
}

export function borrarCarritoInvitado() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: nada que borrar
  }
}

export function sumarItem(items, variante_id, cantidad) {
  const tope = proyecto.tienda.max_cantidad_item;
  const existente = items.find((i) => i.variante_id === variante_id);
  if (existente) return items.map((i) => (i.variante_id === variante_id ? { ...i, cantidad: Math.min(i.cantidad + cantidad, tope) } : i));
  return [...items, { variante_id, cantidad: Math.min(cantidad, tope) }];
}
