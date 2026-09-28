import { http } from "@/api/http.js";

const datos = (r) => r.data.data;
const limpiar = (filtros = {}) => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// Carrito
export const cotizar = async (items) => datos(await http.post("/tienda/carrito/cotizar", { items }));
export const verCarrito = async () => datos(await http.get("/tienda/carrito"));
export const agregarItem = async (item) => datos(await http.post("/tienda/carrito/items", item));
export const cambiarCantidad = async ({ item_id, cantidad }) => datos(await http.patch(`/tienda/carrito/items/${item_id}`, { cantidad }));
export const quitarItem = async (item_id) => datos(await http.delete(`/tienda/carrito/items/${item_id}`));
export const fusionarCarrito = async (cuerpo) => datos(await http.post("/tienda/carrito/fusionar", cuerpo));

// Datos de entrega
export const verPerfil = async () => datos(await http.get("/tienda/perfil"));
export const guardarPerfil = async (perfil) => datos(await http.put("/tienda/perfil", perfil));

// Pedidos del cliente
export const enviarPedido = async (cuerpo) => datos(await http.post("/tienda/pedidos", cuerpo));
export async function misPedidos(filtros) {
  const { data } = await http.get("/tienda/pedidos", { params: limpiar(filtros) });
  return { pedidos: data.data, paginacion: data.paginacion };
}
export const verPedido = async (id) => datos(await http.get(`/tienda/pedidos/${id}`));

// Panel
export async function listarPedidos(filtros) {
  const { data } = await http.get("/pedidos", { params: limpiar(filtros) });
  return { pedidos: data.data, paginacion: data.paginacion };
}
export const resumenPedidos = async () => datos(await http.get("/pedidos/resumen"));
export const verPedidoPanel = async (id) => datos(await http.get(`/pedidos/${id}`));
export const cambiarEstado = async ({ id, ...cuerpo }) => datos(await http.patch(`/pedidos/${id}/estado`, cuerpo));
export const registrarCobro = async ({ id, ...cuerpo }) => datos(await http.post(`/pedidos/${id}/cobros`, cuerpo));
export const anularCobro = async ({ id, cobroId, motivo }) => datos(await http.post(`/pedidos/${id}/cobros/${cobroId}/anular`, { motivo }));
