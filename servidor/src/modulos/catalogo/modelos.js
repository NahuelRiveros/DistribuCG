// Modelos del catálogo. Tablas creadas en migraciones/2026_09_25_1300_crear_catalogo.js
// (el modelo tiene que coincidir con la migración). Importar siempre desde este archivo.
import { DataTypes } from "sequelize";
import { defineModel } from "../../nucleo/db/define_model.js";
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";

// Función, no objeto compartido: Sequelize modifica la definición de cada columna.
const eliminado_en = () => ({ type: DataTypes.DATE, allowNull: true });

export const Categoria = defineModel("categoria", {
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  slug: { type: DataTypes.STRING(100), allowNull: false },
  padre_id: { type: DataTypes.INTEGER, allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  // Se muestra en el menú de la tienda (modo "categorias" de clientes/<id>/navbar.js).
  en_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  eliminado_en: eliminado_en(),
});

export const Producto = defineModel("producto", {
  categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false },
  marca: { type: DataTypes.STRING(80), allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  eliminado_en: eliminado_en(),
});

// Presentación: lo que efectivamente se compra. Precio neto (sin IVA).
export const Variante = defineModel("variante", {
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: true },
  atributos: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  sku: { type: DataTypes.STRING(60), allowNull: true },
  precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  precio_anterior: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 21 },
  controla_stock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  eliminado_en: eliminado_en(),
});

export const ProductoImagen = defineModel("producto_imagen", {
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  public_id: { type: DataTypes.STRING(200), allowNull: true },
  alt: { type: DataTypes.STRING(150), allowNull: true },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

// Tablas de migraciones/2026_09_25_1400_crear_importacion_catalogo.js
export const ImportacionCatalogo = defineModel("importacion_catalogo", {
  id: { type: DataTypes.UUID, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  archivo: { type: DataTypes.STRING(255), allowNull: false },
  huella: { type: DataTypes.STRING(64), allowNull: false },
  opciones: { type: DataTypes.JSONB, allowNull: false },
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "validado" },
  resumen: { type: DataTypes.JSONB, allowNull: false },
  resultado: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  siguiente_lote: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  total_lotes: { type: DataTypes.INTEGER, allowNull: false },
});

export const ImportacionCatalogoLote = defineModel("importacion_catalogo_lote", {
  importacion_id: { type: DataTypes.UUID, allowNull: false },
  indice: { type: DataTypes.INTEGER, allowNull: false },
  registros: { type: DataTypes.JSONB, allowNull: false },
  procesado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

aplicarRelaciones([
  { tipo: "belongsTo", from: Categoria, to: Categoria, foreignKey: "padre_id", as: "padre" },
  { tipo: "hasMany", from: Categoria, to: Categoria, foreignKey: "padre_id", as: "subcategorias" },
  { tipo: "belongsTo", from: Producto, to: Categoria, foreignKey: "categoria_id", as: "categoria" },
  { tipo: "hasMany", from: Categoria, to: Producto, foreignKey: "categoria_id", as: "productos" },
  { tipo: "hasMany", from: Producto, to: Variante, foreignKey: "producto_id", as: "variantes" },
  { tipo: "belongsTo", from: Variante, to: Producto, foreignKey: "producto_id", as: "producto" },
  { tipo: "hasMany", from: Producto, to: ProductoImagen, foreignKey: "producto_id", as: "imagenes" },
]);
