// Módulo stock: saldo por presentación + historial de movimientos (kardex).
// Cada movimiento dice cuánto cambió la cantidad y lo reservado; el saldo se actualiza
// en la misma transacción. El historial no se puede editar ni borrar (trigger).

export const TIPOS_MOVIMIENTO = ["ingreso", "ajuste", "importacion", "reserva", "liberacion", "venta", "devolucion"];

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const sql = (texto) => sequelize.query(texto);
  const ahora = sequelize.literal("CURRENT_TIMESTAMP");

  await queryInterface.createTable({ tableName: "stock", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    variante_id: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: { tableName: "variante", schema }, key: "id" }, onDelete: "RESTRICT" },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reservado: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sql(`ALTER TABLE ${schema}.stock
    ADD CONSTRAINT stock_cantidades_validas CHECK (cantidad >= 0 AND reservado >= 0 AND reservado <= cantidad AND minimo >= 0)`);

  await queryInterface.createTable({ tableName: "movimiento_stock", schema }, {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    variante_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: "variante", schema }, key: "id" }, onDelete: "RESTRICT" },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // cambio en la cantidad (±)
    reservado: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // cambio en lo reservado (±)
    saldo_cantidad: { type: DataTypes.INTEGER, allowNull: false },
    saldo_reservado: { type: DataTypes.INTEGER, allowNull: false },
    costo_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    motivo: { type: DataTypes.STRING(200), allowNull: true },
    referencia_tipo: { type: DataTypes.STRING(30), allowNull: true }, // "remito", "pedido", "importacion"
    referencia_id: { type: DataTypes.STRING(60), allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: "usuario", schema }, key: "id" }, onDelete: "RESTRICT" },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sql(`ALTER TABLE ${schema}.movimiento_stock
    ADD CONSTRAINT movimiento_tipo_valido CHECK (tipo IN (${TIPOS_MOVIMIENTO.map((t) => `'${t}'`).join(", ")})),
    ADD CONSTRAINT movimiento_con_cambio CHECK (cantidad <> 0 OR reservado <> 0),
    ADD CONSTRAINT movimiento_saldos_validos CHECK (saldo_cantidad >= 0 AND saldo_reservado >= 0),
    ADD CONSTRAINT movimiento_costo_valido CHECK (costo_unitario IS NULL OR costo_unitario >= 0)`);
  await sql(`CREATE INDEX movimiento_stock_variante ON ${schema}.movimiento_stock (variante_id, id DESC)`);
  await sql(`CREATE INDEX movimiento_stock_referencia ON ${schema}.movimiento_stock (referencia_tipo, referencia_id)`);
  await sql(`CREATE INDEX movimiento_stock_fecha ON ${schema}.movimiento_stock (creado_en)`);

  // El historial es la prueba de cada cambio: la base rechaza modificarlo o borrarlo.
  await sql(`CREATE FUNCTION ${schema}.movimiento_stock_inmutable() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'Los movimientos de stock no se pueden modificar ni borrar';
    END $$ LANGUAGE plpgsql`);
  await sql(`CREATE TRIGGER movimiento_stock_inmutable BEFORE UPDATE OR DELETE ON ${schema}.movimiento_stock
    FOR EACH ROW EXECUTE FUNCTION ${schema}.movimiento_stock_inmutable()`);
}

export async function down({ queryInterface, sequelize, schema }) {
  await queryInterface.dropTable({ tableName: "movimiento_stock", schema });
  await sequelize.query(`DROP FUNCTION IF EXISTS ${schema}.movimiento_stock_inmutable()`);
  await queryInterface.dropTable({ tableName: "stock", schema });
}
