import { http } from "../../../api/http.js";

// NOTA: el proyecto de referencia (eccomerce/api/catalogo_api.js) tenía además
// un catálogo de "Géneros" (Hombre/Mujer/Niños) usado para dividir la
// navegación y etiquetar categorías. Es específico de indumentaria y quedó
// afuera de esta base — igual que el sistema de variantes talle/color.

const today = () => new Date().toISOString().slice(0, 10);

// ── Categorías (jerárquicas: raíz + subcategorías) ──────────────────────────

export async function getCategorias() {
  const { data } = await http.get("/catalogos/categorias");
  return data.data.map(mapCategoria);
}

export async function createCategoria(nombre, slug, padreId = null) {
  const { data } = await http.post("/catalogos/categorias", {
    nombre, slug, padre_id: padreId, fecha_alta: today(),
  });
  return mapCategoria(data.data);
}

export async function updateCategoria(id, nombre, slug, padreId = null) {
  const { data } = await http.put(`/catalogos/categorias/${id}`, {
    nombre, slug, padre_id: padreId,
  });
  return mapCategoria(data.data);
}

export async function deleteCategoria(id) {
  await http.delete(`/catalogos/categorias/${id}`);
}

// ── Marcas ───────────────────────────────────────────────────────────────

export async function getMarcas() {
  const { data } = await http.get("/catalogos/marcas");
  return data.data.map(mapMarca);
}

export async function createMarca(payload) {
  const { data } = await http.post("/catalogos/marcas", {
    nombre: payload.nombre,
    slug: payload.slug,
    logo: payload.logo ?? null,
    descripcion: payload.descripcion ?? null,
    orden: payload.orden ?? 0,
    fecha_alta: today(),
  });
  return mapMarca(data.data);
}

export async function updateMarca(id, payload) {
  const { data } = await http.put(`/catalogos/marcas/${id}`, {
    nombre: payload.nombre,
    slug: payload.slug,
    logo: payload.logo ?? null,
    descripcion: payload.descripcion ?? null,
    orden: payload.orden ?? 0,
  });
  return mapMarca(data.data);
}

export async function deleteMarca(id) {
  await http.delete(`/catalogos/marcas/${id}`);
}

// ── Talles (opcional — dejar sin cargar si el negocio no usa tamaños) ──────

export async function getTalles() {
  const { data } = await http.get("/catalogos/talles");
  return data.data.map(mapTalle);
}

export async function createTalle(nombre, orden = 0) {
  const { data } = await http.post("/catalogos/talles", { nombre, orden, fecha_alta: today() });
  return mapTalle(data.data);
}

export async function updateTalle(id, nombre, orden = 0) {
  const { data } = await http.put(`/catalogos/talles/${id}`, { nombre, orden });
  return mapTalle(data.data);
}

export async function deleteTalle(id) {
  await http.delete(`/catalogos/talles/${id}`);
}

// ── Colores ──────────────────────────────────────────────────────────────

export async function getColores() {
  const { data } = await http.get("/catalogos/colores");
  return data.data.map(mapColor);
}

export async function createColor(nombre, hex = null, orden = 0) {
  const { data } = await http.post("/catalogos/colores", { nombre, hex, orden, fecha_alta: today() });
  return mapColor(data.data);
}

export async function updateColor(id, nombre, hex = null, orden = 0) {
  const { data } = await http.put(`/catalogos/colores/${id}`, { nombre, hex, orden });
  return mapColor(data.data);
}

export async function deleteColor(id) {
  await http.delete(`/catalogos/colores/${id}`);
}

// ── Opciones de envío ────────────────────────────────────────────────────

export async function getOpcionesEnvio() {
  const { data } = await http.get("/catalogos/opciones-envio");
  return data.data.map(mapOpcionEnvio);
}

export async function createOpcionEnvio(payload) {
  const { data } = await http.post("/catalogos/opciones-envio", toEnvioPayload(payload));
  return mapOpcionEnvio(data.data);
}

export async function updateOpcionEnvio(id, payload) {
  const { data } = await http.put(`/catalogos/opciones-envio/${id}`, toEnvioPayload(payload));
  return mapOpcionEnvio(data.data);
}

export async function deleteOpcionEnvio(id) {
  await http.delete(`/catalogos/opciones-envio/${id}`);
}

// ── Condiciones IVA (checkout/facturación — Argentina) ──────────────────────

export async function getCondicionesIva() {
  const { data } = await http.get("/catalogos/condiciones-iva");
  return data.data.map((c) => ({ id: c.id, codigo: c.codigo, nombre: c.nombre }));
}

// ── mappers ──────────────────────────────────────────────────────────────

function mapCategoria(c) {
  return { id: c.id, nombre: c.nombre, slug: c.slug, padre_id: c.padre_id ?? null };
}

function mapMarca(m) {
  return {
    id: m.id, nombre: m.nombre, slug: m.slug,
    logo: m.logo ?? null, descripcion: m.descripcion ?? null, orden: m.orden ?? 0,
  };
}

function mapTalle(t) {
  return { id: t.id, nombre: t.nombre, orden: t.orden ?? 0 };
}

function mapColor(c) {
  return { id: c.id, nombre: c.nombre, hex: c.hex ?? null, orden: c.orden ?? 0 };
}

function mapOpcionEnvio(o) {
  return {
    id: o.id,
    nombre: o.nombre,
    descripcion: o.descripcion,
    precio: Number(o.precio),
    tiempo_estimado: o.tiempo_estimado,
    gratis_desde: o.gratis_desde != null ? Number(o.gratis_desde) : null,
  };
}

function toEnvioPayload(payload) {
  return {
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    precio: payload.precio,
    tiempo_estimado: payload.tiempo_estimado,
    gratis_desde: payload.gratis_desde,
    fecha_alta: today(),
  };
}
