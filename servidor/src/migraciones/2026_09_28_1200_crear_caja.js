// Módulo caja: ingresos y egresos cargados a mano, con categoría y medio de pago.
// Los cobros de pedidos NO se copian acá: se suman al consultar (leyendo pedido_cobro),
// así un cobro anulado desaparece del balance sin tocar nada más.

export const TIPOS_CAJA = ["ingreso", "egreso"];

// Categorías con las que arranca cada instalación (después se editan desde el panel).
const CATEGORIAS_INICIALES = [
  ["ingreso", "Venta en local", 1],
  ["ingreso", "Otros ingresos", 2],
  ["egreso", "Mercadería", 1],
  ["egreso", "Sueldos", 2],
  ["egreso", "Alquiler", 3],
  ["egreso", "Servicios", 4],
  ["egreso", "Impuestos", 5],
  ["egreso", "Otros gastos", 6],
];

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const sql = (texto, opciones) => sequelize.query(texto, opciones);
  const ahora = () => sequelize.literal("CURRENT_TIMESTAMP");
  const fechas = () => ({
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora() },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora() },
  });
  const usuario = (allowNull) => ({
    type: DataTypes.INTEGER,
    allowNull,
    references: { model: { tableName: "usuario", schema }, key: "id" },
    onDelete: "RESTRICT",
  });
  const tiposSql = TIPOS_CAJA.map((t) => `'${t}'`).join(", ");

  await queryInterface.createTable({ tableName: "caja_categoria", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: DataTypes.STRING(10), allowNull: false },
    nombre: { type: DataTypes.STRING(60), allowNull: false },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...fechas(),
  });
  await sql(`ALTER TABLE ${schema}.caja_categoria
    ADD CONSTRAINT caja_categoria_tipo_valido CHECK (tipo IN (${tiposSql})),
    ADD CONSTRAINT caja_categoria_id_tipo UNIQUE (id, tipo)`);
  // "Sueldos" y "sueldos" son la misma categoría dentro de un tipo.
  await sql(`CREATE UNIQUE INDEX caja_categoria_nombre_unico ON ${schema}.caja_categoria (tipo, lower(nombre))`);

  await queryInterface.createTable({ tableName: "caja_movimiento", schema }, {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    tipo: { type: DataTypes.STRING(10), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    categoria_id: { type: DataTypes.INTEGER, allowNull: false },
    medio: { type: DataTypes.STRING(30), allowNull: false },
    descripcion: { type: DataTypes.STRING(200), allowNull: true },
    registrado_por: usuario(false),
    actualizado_por: usuario(true),
    anulado_en: { type: DataTypes.DATE, allowNull: true },
    anulado_por: usuario(true),
    motivo_anulacion: { type: DataTypes.STRING(300), allowNull: true },
    ...fechas(),
  });
  // La FK compuesta (categoria_id, tipo) garantiza en la base que un egreso
  // nunca quede con una categoría de ingreso (ni al revés).
  await sql(`ALTER TABLE ${schema}.caja_movimiento
    ADD CONSTRAINT caja_movimiento_tipo_valido CHECK (tipo IN (${tiposSql})),
    ADD CONSTRAINT caja_movimiento_monto_valido CHECK (monto > 0),
    ADD CONSTRAINT caja_movimiento_anulacion_completa CHECK ((anulado_en IS NULL) = (anulado_por IS NULL)),
    ADD CONSTRAINT caja_movimiento_categoria FOREIGN KEY (categoria_id, tipo)
      REFERENCES ${schema}.caja_categoria (id, tipo) ON DELETE RESTRICT`);
  await sql(`CREATE INDEX caja_movimiento_fecha ON ${schema}.caja_movimiento (fecha)`);
  await sql(`CREATE INDEX caja_movimiento_categoria_idx ON ${schema}.caja_movimiento (categoria_id)`);
  await sql(`CREATE INDEX caja_movimiento_registrado_por ON ${schema}.caja_movimiento (registrado_por)`);
  await sql(`CREATE INDEX caja_movimiento_actualizado_por ON ${schema}.caja_movimiento (actualizado_por)`);
  await sql(`CREATE INDEX caja_movimiento_anulado_por ON ${schema}.caja_movimiento (anulado_por)`);

  for (const [tipo, nombre, orden] of CATEGORIAS_INICIALES) {
    await sql(`INSERT INTO ${schema}.caja_categoria (tipo, nombre, orden) VALUES (:tipo, :nombre, :orden)`, { replacements: { tipo, nombre, orden } });
  }
}

export async function down({ queryInterface, schema }) {
  await queryInterface.dropTable({ tableName: "caja_movimiento", schema });
  await queryInterface.dropTable({ tableName: "caja_categoria", schema });
}
