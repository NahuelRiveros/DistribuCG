import { http } from "../../api/http.js";

export async function getCarrito() {
  const { data } = await http.get("/carrito");
  return data.data;
}

// precio_unidad NO se envía — el backend siempre obtiene el precio desde la base de datos
export async function addCarritoItem({ producto_id, variante_id = null, cantidad }) {
  const { data } = await http.post("/carrito/items", { producto_id, variante_id, cantidad });
  return data.data;
}

export async function updateCarritoItem(itemId, cantidad) {
  const { data } = await http.put(`/carrito/items/${itemId}`, { cantidad });
  return data.data;
}

export async function removeCarritoItem(itemId) {
  const { data } = await http.delete(`/carrito/items/${itemId}`);
  return data.data;
}

export async function clearCarrito() {
  await http.delete("/carrito");
}
