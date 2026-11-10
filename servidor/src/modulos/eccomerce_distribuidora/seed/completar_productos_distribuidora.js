import { formatearNombre, claveMarca } from "../../../core/services/common/formato_nombre.js";

const clave = (texto) => String(texto).trim().replace(/\s+/g, " ")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
const slug = (texto) => clave(texto).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
const identidad = (categoriaId, nombre) => `${categoriaId}:${clave(nombre)}`;

function imagenValida(valor) {
  if (valor == null) return true;
  if (typeof valor !== "string" || valor.length > 500) return false;
  try {
    const url = new URL(valor);
    return valor.startsWith("https://") && url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** "Familia › Categoría" de cada lista del catálogo → categoría vigente de la base (o null). */
async function resolverRutas(CategoriaDistribuidora, catalogo, transaction) {
  const categorias = await CategoriaDistribuidora.findAll({
    where: { fecha_baja: null }, attributes: ["id", "nombre", "slug", "padre_id"], raw: true, transaction,
  });
  const porNombre = new Map(categorias.map((c) => [identidad(c.padre_id, c.nombre), c]));
  const porSlug = new Map(categorias.map((c) => [c.slug, c]));
  function resolverCategoria(ruta) {
    const partes = ruta.split("›").map((p) => p.trim());
    if (partes.length !== 2 || partes.some((p) => !p)) return null;
    const [familia, nombre] = partes;
    const raiz = porNombre.get(identidad(null, familia)) ?? porSlug.get(slug(familia));
    if (!raiz || raiz.padre_id != null) return null;
    const categoria = porNombre.get(identidad(raiz.id, nombre)) ?? porSlug.get(slug(`${familia} ${nombre}`));
    return categoria?.padre_id === raiz.id ? categoria : null;
  }
  return new Map(Object.keys(catalogo).map((ruta) => [ruta, resolverCategoria(ruta)]));
}

/**
 * Da de baja (no borra) los artículos vigentes del catálogo inicial: los pedidos viejos
 * los siguen mostrando. Respeta los que tienen una presentación con código interno,
 * porque esos ya son del catálogo real del cliente aunque se llamen igual.
 */
export async function retirarProductos(modelos, catalogo, transaction, { aplicar = false } = {}) {
  const { CategoriaDistribuidora, ProductoDistribuidora, VariedadDistribuidora } = modelos;
  const rutas = await resolverRutas(CategoriaDistribuidora, catalogo, transaction);
  const ids = [...new Set([...rutas.values()].filter(Boolean).map((c) => c.id))];
  if (!ids.length) return { retirados: 0, conservados: 0 };
  const buscados = new Set(Object.entries(catalogo).flatMap(([ruta, productos]) => {
    const categoria = rutas.get(ruta);
    return categoria ? productos.map((p) => identidad(categoria.id, formatearNombre(p.nombre))) : [];
  }));
  const vigentes = await ProductoDistribuidora.findAll({
    where: { categoria_id: ids, fecha_baja: null }, attributes: ["id", "nombre", "categoria_id"], raw: true, transaction,
  });
  const candidatos = vigentes.filter((p) => buscados.has(identidad(p.categoria_id, p.nombre)));
  if (!candidatos.length) return { retirados: 0, conservados: 0 };
  const conCodigo = await VariedadDistribuidora.findAll({
    where: { producto_id: candidatos.map((p) => p.id), fecha_baja: null }, attributes: ["producto_id", "cod_ref"], raw: true, transaction,
  });
  const delCliente = new Set(conCodigo.filter((v) => v.cod_ref?.trim()).map((v) => v.producto_id));
  const retirar = candidatos.filter((p) => !delCliente.has(p.id)).map((p) => p.id);
  if (aplicar && retirar.length) {
    await ProductoDistribuidora.update({ activo: false, fecha_baja: new Date() }, { where: { id: retirar, fecha_baja: null }, transaction });
  }
  return { retirados: retirar.length, conservados: delCliente.size };
}

/** Solo crea artículos inactivos. La copia del nombre de marca la resuelve el servicio. */
export async function completarProductos(modelos, catalogo, transaction, resolverMarca) {
  const { CategoriaDistribuidora, MarcaDistribuidora, MarcaCategoriaDistribuidora, ProductoDistribuidora } = modelos;
  const rutas = await resolverRutas(CategoriaDistribuidora, catalogo, transaction);
  const ids = [...new Set([...rutas.values()].filter(Boolean).map((c) => c.id))];
  const marcas = await MarcaDistribuidora.findAll({ attributes: ["id", "clave"], raw: true, transaction });
  const porMarca = new Map(marcas.map((m) => [m.clave, m]));
  const asociaciones = await MarcaCategoriaDistribuidora.findAll({
    attributes: ["marca_id", "categoria_id"], raw: true, transaction,
  });
  const pares = new Set(asociaciones.map((a) => `${a.marca_id}:${a.categoria_id}`));
  // Incluye inactivos y bajas: nunca se recrea un artículo retirado por el cliente.
  const anteriores = ids.length ? await ProductoDistribuidora.findAll({
    where: { categoria_id: ids }, attributes: ["nombre", "categoria_id", "fecha_baja"], raw: true, transaction,
  }) : [];
  const existentes = new Map(anteriores.map((p) => [identidad(p.categoria_id, p.nombre), p]));
  const resultado = { productos: 0, existentes: 0, omitidos: [] };
  const nuevas = [];
  const marcasResueltas = new Map();

  for (const [ruta, productos] of Object.entries(catalogo)) {
    const categoria = rutas.get(ruta);
    for (const producto of productos) {
      const nombre = typeof producto?.nombre === "string" ? formatearNombre(producto.nombre) : "";
      const omitir = (motivo) => resultado.omitidos.push({ ruta, nombre, motivo });
      if (!nombre || nombre.length > 150) { omitir("Nombre vacío o mayor a 150 caracteres"); continue; }
      if (!categoria) { omitir("Familia o categoría no disponible"); continue; }
      const llave = identidad(categoria.id, nombre);
      const existente = existentes.get(llave);
      if (existente) {
        if (existente.fecha_baja != null) omitir("Artículo dado de baja");
        else resultado.existentes++;
        continue;
      }
      const marca = typeof producto.marca === "string" ? porMarca.get(claveMarca(producto.marca)) : null;
      if (!marca) { omitir("Marca no disponible"); continue; }
      if (![categoria.id, categoria.padre_id].some((id) => pares.has(`${marca.id}:${id}`))) {
        omitir("Marca no asociada a la familia o categoría"); continue;
      }
      if (!imagenValida(producto.imagen_url)) { omitir("La imagen debe ser una URL HTTPS de hasta 500 caracteres"); continue; }
      if (producto.descripcion != null && typeof producto.descripcion !== "string") {
        omitir("La descripción debe ser texto"); continue;
      }
      const par = `${marca.id}:${categoria.id}`;
      if (!marcasResueltas.has(par)) {
        marcasResueltas.set(par, await resolverMarca({ marca_id: marca.id, categoria_id: categoria.id }, transaction));
      }
      nuevas.push({
        categoria_id: categoria.id, nombre, descripcion: producto.descripcion ?? null,
        ...marcasResueltas.get(par), imagen_url: producto.imagen_url ?? null, activo: false,
      });
      existentes.set(llave, { fecha_baja: null });
    }
  }
  if (nuevas.length) {
    await ProductoDistribuidora.bulkCreate(nuevas, { transaction, validate: true });
    resultado.productos = nuevas.length;
  }
  return resultado;
}
