// Módulo catálogo: categorías (árbol), productos, presentaciones (variantes) e imágenes.
// Nada se borra físicamente: eliminado_en marca la baja y los índices únicos la ignoran.

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const ahora = sequelize.literal("CURRENT_TIMESTAMP");
  const tiempos = {
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    eliminado_en: { type: DataTypes.DATE, allowNull: true },
  };
  const id = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };
  const ref = (tabla, onDelete, allowNull = false) => ({
    type: DataTypes.INTEGER,
    allowNull,
    references: { model: { tableName: tabla, schema }, key: "id" },
    onDelete,
  });
  const sql = (texto) => sequelize.query(texto);

  // ── categoria ──
  await queryInterface.createTable({ tableName: "categoria", schema }, {
    id,
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    padre_id: ref("categoria", "RESTRICT", true), // null = categoría raíz
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...tiempos,
  });
  await sql(`CREATE INDEX categoria_padre_id ON ${schema}.categoria (padre_id)`);
  await sql(`CREATE UNIQUE INDEX categoria_slug_unico ON ${schema}.categoria (slug) WHERE eliminado_en IS NULL`);
  // COALESCE: en Postgres dos NULL no son "iguales", así que sin esto se podrían repetir raíces.
  await sql(`CREATE UNIQUE INDEX categoria_nombre_unico ON ${schema}.categoria (COALESCE(padre_id, 0), lower(nombre)) WHERE eliminado_en IS NULL`);

  // ── producto ──
  await queryInterface.createTable({ tableName: "producto", schema }, {
    id,
    categoria_id: ref("categoria", "RESTRICT"),
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    marca: { type: DataTypes.STRING(80), allowNull: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...tiempos,
  });
  await sql(`CREATE INDEX producto_categoria_id ON ${schema}.producto (categoria_id)`);
  await sql(`CREATE INDEX producto_visibles ON ${schema}.producto (nombre) WHERE activo AND publicado AND eliminado_en IS NULL`);
  await sql(`CREATE UNIQUE INDEX producto_slug_unico ON ${schema}.producto (slug) WHERE eliminado_en IS NULL`);
  await sql(`CREATE UNIQUE INDEX producto_nombre_unico ON ${schema}.producto (categoria_id, lower(nombre)) WHERE eliminado_en IS NULL`);

  // Búsqueda "contiene" (ILIKE '%texto%') rápida con pg_trgm. La extensión es de toda la base:
  // si ya existe (por ejemplo, instalada por otro proyecto en otro schema) se usa la de ahí.
  await sql("CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public");
  const [[{ esquema_trgm }]] = await sequelize.query(
    "SELECT n.nspname AS esquema_trgm FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm'",
  );
  await sql(`CREATE INDEX producto_nombre_trgm ON ${schema}.producto USING gin (nombre ${esquema_trgm}.gin_trgm_ops)`);

  // ── variante (presentación) ──
  await queryInterface.createTable({ tableName: "variante", schema }, {
    id,
    producto_id: ref("producto", "RESTRICT"),
    nombre: { type: DataTypes.STRING(100), allowNull: true }, // null = producto sin presentaciones
    atributos: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    sku: { type: DataTypes.STRING(60), allowNull: true },
    precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // neto, sin IVA
    precio_anterior: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 21 },
    controla_stock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...tiempos,
  });
  await sql(`ALTER TABLE ${schema}.variante
    ADD CONSTRAINT variante_precio_valido CHECK (precio >= 0),
    ADD CONSTRAINT variante_precio_anterior_valido CHECK (precio_anterior IS NULL OR precio_anterior >= 0),
    ADD CONSTRAINT variante_iva_valido CHECK (iva_porcentaje BETWEEN 0 AND 100)`);
  await sql(`CREATE INDEX variante_producto_id ON ${schema}.variante (producto_id)`);
  await sql(`CREATE UNIQUE INDEX variante_sku_unico ON ${schema}.variante (lower(sku)) WHERE sku IS NOT NULL AND eliminado_en IS NULL`);
  await sql(`CREATE UNIQUE INDEX variante_nombre_unico ON ${schema}.variante (producto_id, lower(COALESCE(nombre, ''))) WHERE eliminado_en IS NULL`);

  // ── producto_imagen ──
  await queryInterface.createTable({ tableName: "producto_imagen", schema }, {
    id,
    producto_id: ref("producto", "CASCADE"),
    url: { type: DataTypes.STRING(500), allowNull: false },
    public_id: { type: DataTypes.STRING(200), allowNull: true }, // id en Cloudinary, para poder borrarla
    alt: { type: DataTypes.STRING(150), allowNull: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    creado_en: tiempos.creado_en,
    actualizado_en: tiempos.actualizado_en,
  });
  await sql(`CREATE INDEX producto_imagen_producto_orden ON ${schema}.producto_imagen (producto_id, orden)`);
}

export async function down({ queryInterface, schema }) {
  // pg_trgm no se borra: es compartida por toda la base.
  await queryInterface.dropTable({ tableName: "producto_imagen", schema });
  await queryInterface.dropTable({ tableName: "variante", schema });
  await queryInterface.dropTable({ tableName: "producto", schema });
  await queryInterface.dropTable({ tableName: "categoria", schema });
}
