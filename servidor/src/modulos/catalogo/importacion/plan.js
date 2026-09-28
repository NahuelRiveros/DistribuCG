import { createHash } from "node:crypto";
import { claveTexto } from "./normalizar.js";

// Adaptado de DistribuCG (services/distribuidora/importacion/plan.js).
// Decide qué pasa con cada fila (crear / actualizar / sin cambios / omitir / error)
// SIN tocar la base. Se usa al validar y otra vez al ejecutar cada lote, para detectar
// si el catálogo cambió en el medio.

export const hash = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
export const claveGrupo = (...partes) => JSON.stringify(partes.map(claveTexto));
const huellaVariante = (v) => hash([v.id, v.producto_id, v.nombre, String(v.precio), String(v.iva_porcentaje), v.sku, v.controla_stock, v.stock_cantidad]);
const huellaProducto = (p) => hash([p.nombre, p.categoria_id, p.activo]);

/** id de categoría → "Almacén > Galletitas" */
export function rutasCategorias(categorias) {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const rutas = new Map();
  const resolver = (id, vistos = new Set()) => {
    if (rutas.has(id)) return rutas.get(id);
    if (vistos.has(id)) throw new Error("El árbol de categorías contiene un ciclo.");
    vistos.add(id);
    const categoria = porId.get(id);
    if (!categoria) return "";
    const ruta = (categoria.padre_id ? `${resolver(categoria.padre_id, vistos)} > ` : "") + categoria.nombre;
    rutas.set(id, ruta);
    return ruta;
  };
  categorias.forEach((c) => resolver(c.id));
  return rutas;
}

const agrupar = (lista, clave) => {
  const salida = new Map();
  for (const item of lista) {
    const k = clave(item);
    if (!salida.has(k)) salida.set(k, []);
    salida.get(k).push(item);
  }
  return salida;
};

/** Precio del archivo → precio neto a guardar (si el archivo trae precio final, se le saca el IVA). */
function precioNeto(importe, iva, tipo_precio) {
  const neto = tipo_precio === "final" ? importe / (1 + iva / 100) : importe;
  return Math.round(neto * 100) / 100;
}

export function armarPlan(filas, opciones, catalogo) {
  const rutas = rutasCategorias(catalogo.categorias);
  const productos = new Map(catalogo.productos.map((p) => [p.id, p]));
  const porNombre = agrupar(catalogo.productos, (p) => claveGrupo(rutas.get(p.categoria_id), p.nombre));
  const porSku = agrupar(catalogo.variantes.filter((v) => v.sku), (v) => claveTexto(v.sku));
  const porPresentacion = agrupar(catalogo.variantes, (v) => claveGrupo(v.producto_id, v.nombre));
  const identidadDe = (v) => (opciones.identidad === "sku" ? claveTexto(v.sku) : claveGrupo(v.categoria, v.producto, v.presentacion));
  const repetidas = agrupar(filas.filter((f) => f.valor), (f) => identidadDe(f.valor));
  const presentacionesArchivo = agrupar(
    filas.filter((f) => f.valor?.producto && f.valor.categoria),
    (f) => claveGrupo(f.valor.categoria, f.valor.producto, f.valor.presentacion),
  );

  return filas.map((fila) => {
    if (fila.accion === "error") return fila;
    const valor = fila.valor;
    const error = (mensaje) => ({ fila: fila.fila, valor, accion: "error", mensaje });

    if (repetidas.get(identidadDe(valor))?.length > 1) return error("Hay otra fila con el mismo código o producto. Dejá una fila por presentación.");
    if (presentacionesArchivo.get(claveGrupo(valor.categoria, valor.producto, valor.presentacion))?.length > 1) {
      return error("La misma presentación aparece con códigos distintos. Revisá el nombre o la presentación.");
    }
    if (opciones.identidad === "nombre" && !valor.categoria) return error("Para reconocer por nombre hace falta la categoría.");

    let variante;
    let producto;
    if (opciones.identidad === "sku") {
      const coincidencias = porSku.get(claveTexto(valor.sku)) ?? [];
      if (coincidencias.length > 1) return error("El código está repetido en el catálogo. Corregilo antes de importar.");
      variante = coincidencias[0];
      producto = variante && productos.get(variante.producto_id);
      if (variante && !producto) return error("El código pertenece a un producto dado de baja.");
    }
    const candidatos = porNombre.get(claveGrupo(valor.categoria, valor.producto)) ?? [];
    if (!producto && candidatos.length > 1) return error("Hay más de un producto con ese nombre en esa categoría.");
    if (!producto) producto = candidatos[0];

    const presentaciones = producto ? (porPresentacion.get(claveGrupo(producto.id, valor.presentacion)) ?? []) : [];
    if (!variante && presentaciones.length > 1) return error("La presentación es ambigua en el catálogo.");
    if (opciones.identidad === "nombre") {
      variante = presentaciones[0];
      const conEseCodigo = valor.sku ? (porSku.get(claveTexto(valor.sku)) ?? []) : [];
      if (conEseCodigo.some((v) => v.id !== variante?.id) || (variante?.sku && valor.sku && claveTexto(variante.sku) !== claveTexto(valor.sku))) {
        return error("El código y la presentación corresponden a productos distintos.");
      }
    } else if (!variante && presentaciones.length) {
      return error("Esa presentación ya existe con otro código (o sin código). Revisá el SKU o reconocé los productos por nombre.");
    }

    if (variante && opciones.modo === "crear") return { fila: fila.fila, valor, accion: "omitir", mensaje: "Ya existe: el modo es solo crear." };
    if (!variante && opciones.modo === "actualizar") return { fila: fila.fila, valor, accion: "omitir", mensaje: "No existe: el modo es solo actualizar." };
    if (!variante && (!valor.producto || !valor.categoria)) return error("Para crear faltan el nombre o la categoría (podés indicar una categoría por defecto).");

    const actualiza = (campo) => opciones.actualizar.includes(campo);
    const iva = variante
      ? actualiza("iva_porcentaje") && valor.iva_porcentaje != null
        ? valor.iva_porcentaje
        : Number(variante.iva_porcentaje)
      : (valor.iva_porcentaje ?? opciones.iva_por_defecto);
    const precio = valor.importe == null ? null : precioNeto(valor.importe, iva, opciones.tipo_precio);
    if (!variante && precio == null) return error("Para crear falta el precio.");

    const cambios = {};
    if (precio != null && (!variante || actualiza("precio"))) cambios.precio = precio;
    if (!variante || (actualiza("iva_porcentaje") && valor.iva_porcentaje != null)) cambios.iva_porcentaje = iva;
    if (!variante || (!variante.sku && valor.sku)) cambios.sku = valor.sku;
    // Stock: es la cantidad objetivo; al aplicar se registra la diferencia como movimiento.
    if (valor.stock != null && (!variante || actualiza("stock"))) {
      if (variante && valor.stock < (variante.stock_reservado ?? 0)) {
        return error(`El stock no puede quedar por debajo de lo reservado para pedidos (${variante.stock_reservado}).`);
      }
      cambios.stock = valor.stock;
    }
    const distinto = (k, v) => {
      if (k === "sku") return variante.sku !== v;
      if (k === "stock") return !variante.controla_stock || (variante.stock_cantidad ?? 0) !== v;
      return Number(variante[k]) !== v;
    };
    const cambia = variante && Object.entries(cambios).some(([k, v]) => distinto(k, v));

    return {
      fila: fila.fila,
      valor,
      accion: variante ? (cambia ? "actualizar" : "sin_cambios") : "crear",
      cambios,
      destino: variante?.id ?? null,
      producto_id: producto?.id ?? null,
      antes: variante ? huellaVariante(variante) : null,
      producto_antes: producto ? huellaProducto(producto) : null,
      precio_anterior: variante ? Number(variante.precio) : null,
      precio_final: precio,
      mensaje: variante ? "Se conservan nombre, marca, descripción, categoría e imágenes." : producto ? "Nueva presentación de un producto existente." : "Producto nuevo.",
    };
  });
}

export function resumir(filas) {
  const resumen = { total: filas.length, crear: 0, actualizar: 0, sin_cambios: 0, omitir: 0, error: 0 };
  for (const fila of filas) resumen[fila.accion]++;
  return resumen;
}
