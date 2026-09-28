import { Op } from "sequelize";
import { sequelize } from "../../../nucleo/db/sequelize.js";
import { Categoria, Producto, Variante } from "../modelos.js";
import { generarSlugUnico } from "../slugs.js";
import { Stock } from "../../stock/modelos.js";
import { registrarMovimientos } from "../../stock/movimientos.js";
import { claveTexto } from "./normalizar.js";
import { claveGrupo, rutasCategorias } from "./plan.js";

// Adaptado de DistribuCG (services/distribuidora/importacion/catalog_repository.js):
// solo trae de la base lo que el archivo puede tocar, en tandas de 500.

const unicos = (filas) => [...new Map(filas.map((f) => [f.id, f])).values()];
const tandas = (lista, tamano = 500) => Array.from({ length: Math.ceil(lista.length / tamano) }, (_, i) => lista.slice(i * tamano, (i + 1) * tamano));
const enMinusculas = (columna, valores) => sequelize.where(sequelize.fn("lower", sequelize.col(columna)), { [Op.in]: valores });

async function leerEnTandas(Modelo, valores, condicion, atributos, transaction) {
  const salida = [];
  for (const parte of tandas([...new Set(valores)])) {
    salida.push(...(await Modelo.findAll({ where: { eliminado_en: null, ...condicion(parte) }, attributes: atributos, raw: true, transaction })));
  }
  return salida;
}

const ATR_PRODUCTO = ["id", "categoria_id", "nombre", "activo"];
const ATR_VARIANTE = ["id", "producto_id", "nombre", "sku", "precio", "iva_porcentaje", "controla_stock"];

export async function cargarCatalogo(filas, transaction) {
  const valores = filas.filter((f) => f.valor).map((f) => f.valor);
  const categorias = await Categoria.findAll({ where: { eliminado_en: null }, attributes: ["id", "nombre", "padre_id"], raw: true, transaction });
  let productos = await leerEnTandas(Producto, valores.map((v) => claveTexto(v.producto)).filter(Boolean), (nombres) => ({ [Op.and]: enMinusculas("nombre", nombres) }), ATR_PRODUCTO, transaction);
  let variantes = await leerEnTandas(Variante, valores.map((v) => claveTexto(v.sku)).filter(Boolean), (skus) => ({ [Op.and]: enMinusculas("sku", skus) }), ATR_VARIANTE, transaction);
  productos = unicos([...productos, ...(await leerEnTandas(Producto, variantes.map((v) => v.producto_id), (ids) => ({ id: { [Op.in]: ids } }), ATR_PRODUCTO, transaction))]);
  variantes = unicos([...variantes, ...(await leerEnTandas(Variante, productos.map((p) => p.id), (ids) => ({ producto_id: { [Op.in]: ids } }), ATR_VARIANTE, transaction))]);

  // Saldo actual de cada presentación (para calcular la diferencia de stock y detectar cambios).
  const saldos = new Map();
  for (const parte of tandas(variantes.map((v) => v.id))) {
    for (const s of await Stock.findAll({ where: { variante_id: { [Op.in]: parte } }, attributes: ["variante_id", "cantidad", "reservado"], raw: true, transaction })) {
      saldos.set(s.variante_id, s);
    }
  }
  variantes = variantes.map((v) => ({ ...v, stock_cantidad: saldos.get(v.id)?.cantidad ?? 0, stock_reservado: saldos.get(v.id)?.reservado ?? 0 }));
  return { categorias, productos, variantes };
}

/**
 * Aplica un lote ya revisado: crea categorías y productos que falten, crea y actualiza
 * presentaciones y registra el stock como movimientos (la diferencia con el saldo actual).
 */
export async function aplicarPlan(plan, catalogo, transaction, { usuario_id = null, importacion_id = null } = {}) {
  const altas = plan.filter((f) => f.accion === "crear");
  const rutas = rutasCategorias(catalogo.categorias);
  const idPorRuta = new Map([...rutas].map(([id, ruta]) => [claveTexto(ruta), id]));

  // Categorías que faltan, nivel por nivel ("Almacén" antes que "Almacén > Galletitas").
  const rutasNuevas = new Map();
  for (const fila of altas) {
    const partes = fila.valor.categoria.split(" > ");
    partes.forEach((_, i) => {
      const ruta = partes.slice(0, i + 1).join(" > ");
      if (!idPorRuta.has(claveTexto(ruta))) rutasNuevas.set(claveTexto(ruta), ruta);
    });
  }
  const pendientes = [...rutasNuevas.entries()].sort(([, a], [, b]) => a.split(" > ").length - b.split(" > ").length);
  for (const [clave, ruta] of pendientes) {
    const partes = ruta.split(" > ");
    const nombre = partes.at(-1);
    const padre_id = partes.length > 1 ? idPorRuta.get(claveTexto(partes.slice(0, -1).join(" > "))) : null;
    const slug = await generarSlugUnico(Categoria, nombre, { largo: 90, transaction });
    const categoria = await Categoria.create({ nombre, padre_id, slug }, { transaction });
    idPorRuta.set(clave, categoria.id);
  }

  // Productos que faltan (varias filas pueden ser presentaciones del mismo producto nuevo).
  const idPorProducto = new Map(catalogo.productos.map((p) => [claveGrupo(rutas.get(p.categoria_id), p.nombre), p.id]));
  let productosNuevos = 0;
  for (const fila of altas) {
    if (fila.producto_id) continue;
    const clave = claveGrupo(fila.valor.categoria, fila.valor.producto);
    if (idPorProducto.has(clave)) continue;
    const slug = await generarSlugUnico(Producto, fila.valor.producto, { largo: 170, transaction });
    const producto = await Producto.create(
      { nombre: fila.valor.producto, categoria_id: idPorRuta.get(claveTexto(fila.valor.categoria)), marca: fila.valor.marca, descripcion: fila.valor.descripcion, slug },
      { transaction },
    );
    idPorProducto.set(clave, producto.id);
    productosNuevos++;
  }

  const movimiento = (variante_id, cantidad) => ({
    variante_id,
    tipo: "importacion",
    cantidad,
    motivo: "Importación de catálogo",
    referencia_tipo: "importacion",
    referencia_id: importacion_id,
    usuario_id,
  });
  const movimientos = [];

  if (altas.length) {
    const creadas = await Variante.bulkCreate(
      altas.map((f) => {
        const { stock, ...cambios } = f.cambios;
        return {
          producto_id: f.producto_id || idPorProducto.get(claveGrupo(f.valor.categoria, f.valor.producto)),
          nombre: f.valor.presentacion,
          ...cambios,
          controla_stock: stock != null,
        };
      }),
      { transaction, returning: true },
    );
    creadas.forEach((variante, i) => {
      if (altas[i].cambios.stock > 0) movimientos.push(movimiento(variante.id, altas[i].cambios.stock));
    });
  }

  for (const fila of plan.filter((f) => f.accion === "actualizar")) {
    const { stock, ...cambios } = fila.cambios;
    if (stock !== undefined) cambios.controla_stock = true;
    if (Object.keys(cambios).length) await Variante.update(cambios, { where: { id: fila.destino }, transaction });
    if (stock !== undefined) {
      const saldo = await Stock.findOne({ where: { variante_id: fila.destino }, transaction, lock: transaction.LOCK.UPDATE });
      const diferencia = stock - (saldo?.cantidad ?? 0);
      if (diferencia !== 0) movimientos.push(movimiento(fila.destino, diferencia));
    }
  }
  await registrarMovimientos(movimientos, { transaction });
  return { productos: productosNuevos, categorias: pendientes.length };
}
