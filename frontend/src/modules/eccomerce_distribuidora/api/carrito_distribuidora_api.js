import { http } from "../../../api/http.js";

export async function getCarrito() {
  const { data } = await http.get("/distribuidora/carrito");
  return data.data;
}

// precio_unidad NO se envía — el backend siempre obtiene el precio desde la base de datos
export async function addCarritoItem({ producto_id, variedad_id = null, cantidad }) {
  const { data } = await http.post("/distribuidora/carrito/items", { producto_id, variedad_id, cantidad });
  return data.data;
}

export async function updateCarritoItem(itemId, cantidad) {
  const { data } = await http.put(`/distribuidora/carrito/items/${itemId}`, { cantidad });
  return data.data;
}

export async function removeCarritoItem(itemId) {
  const { data } = await http.delete(`/distribuidora/carrito/items/${itemId}`);
  return data.data;
}

export async function clearCarrito() {
  await http.delete("/distribuidora/carrito");
}
