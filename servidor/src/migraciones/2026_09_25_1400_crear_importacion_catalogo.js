// Importaciones de catálogo desde Excel/CSV (adaptado de DistribuCG).
// Una importación se valida entera y se guarda en lotes; cada lote se ejecuta una sola vez,
// así un corte de conexión o un doble click nunca duplica productos.

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const ahora = sequelize.literal("CURRENT_TIMESTAMP");

  await queryInterface.createTable({ tableName: "importacion_catalogo", schema }, {
    id: { type: DataTypes.UUID, primaryKey: true }, // lo genera el navegador: repetir la validación no crea otra
    usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: "usuario", schema }, key: "id" }, onDelete: "RESTRICT" },
    archivo: { type: DataTypes.STRING(255), allowNull: false },
    huella: { type: DataTypes.STRING(64), allowNull: false }, // hash de archivo + opciones
    opciones: { type: DataTypes.JSONB, allowNull: false },
    estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "validado" },
    resumen: { type: DataTypes.JSONB, allowNull: false },
    resultado: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    siguiente_lote: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_lotes: { type: DataTypes.INTEGER, allowNull: false },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sequelize.query(`ALTER TABLE ${schema}.importacion_catalogo
    ADD CONSTRAINT importacion_estado_valido CHECK (estado IN ('validado', 'procesando', 'completado', 'cancelado'))`);
  await sequelize.query(`CREATE INDEX importacion_catalogo_usuario ON ${schema}.importacion_catalogo (usuario_id, creado_en DESC)`);

  await queryInterface.createTable({ tableName: "importacion_catalogo_lote", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    importacion_id: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: "importacion_catalogo", schema }, key: "id" }, onDelete: "CASCADE" },
    indice: { type: DataTypes.INTEGER, allowNull: false },
    registros: { type: DataTypes.JSONB, allowNull: false },
    procesado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sequelize.query(`CREATE UNIQUE INDEX importacion_lote_unico ON ${schema}.importacion_catalogo_lote (importacion_id, indice)`);
}

export async function down({ queryInterface, schema }) {
  await queryInterface.dropTable({ tableName: "importacion_catalogo_lote", schema });
  await queryInterface.dropTable({ tableName: "importacion_catalogo", schema });
}
