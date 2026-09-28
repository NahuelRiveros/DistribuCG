import { http } from "@/api/http.js";

// Categorías
export const listarCategorias = async () => (await http.get("/catalogo/categorias")).data.data;
export const crearCategoria = async (datos) => (await http.post("/catalogo/categorias", datos)).data.data;
export const actualizarCategoria = async ({ id, ...datos }) => (await http.put(`/catalogo/categorias/${id}`, datos)).data.data;
export const eliminarCategoria = async (id) => http.delete(`/catalogo/categorias/${id}`);

// Productos
export async function listarProductos(filtros) {
  const { data } = await http.get("/catalogo/productos", { params: limpiar(filtros) });
  return { productos: data.data, paginacion: data.paginacion };
}
export const obtenerProducto = async (clave) => (await http.get(`/catalogo/productos/${encodeURIComponent(clave)}`)).data.data;
export const crearProducto = async (datos) => (await http.post("/catalogo/productos", datos)).data.data;
export const actualizarProducto = async ({ id, ...datos }) => (await http.put(`/catalogo/productos/${id}`, datos)).data.data;
export const cambiarEstadoProducto = async ({ id, ...estado }) => (await http.patch(`/catalogo/productos/${id}/estado`, estado)).data.data;
export const eliminarProducto = async (id) => http.delete(`/catalogo/productos/${id}`);

// No mandar filtros vacíos (el servidor los rechazaría o los trataría como valor).
function limpiar(filtros = {}) {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

// Precios
export const ajustarPrecios = async (datos) => (await http.post("/catalogo/precios/ajuste", datos)).data.data;

// Imágenes
export async function subirImagen({ productoId, archivo }) {
  const formulario = new FormData();
  formulario.append("imagen", archivo);
  return (await http.post(`/catalogo/productos/${productoId}/imagenes`, formulario, { timeout: 60_000 })).data.data;
}
export const agregarImagenUrl = async ({ productoId, ...datos }) => (await http.post(`/catalogo/productos/${productoId}/imagenes/url`, datos)).data.data;
export const ordenarImagenes = async ({ productoId, ids }) => (await http.put(`/catalogo/productos/${productoId}/imagenes/orden`, { ids })).data.data;
export const eliminarImagen = async ({ productoId, imagenId }) => http.delete(`/catalogo/productos/${productoId}/imagenes/${imagenId}`);
