// Configuración editable desde el panel (hoy: "pagos"). Un documento JSON por sección,
// validado con el schema compartido. Si una sección no está guardada, rige el valor
// inicial de proyecto.config.js. Cada cambio queda registrado (quién, cuándo, antes/después).

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const ahora = () => sequelize.literal("CURRENT_TIMESTAMP");
  const usuario = (allowNull) => ({
    type: DataTypes.INTEGER,
    allowNull,
    references: { model: { tableName: "usuario", schema }, key: "id" },
    onDelete: "RESTRICT",
  });

  await queryInterface.createTable({ tableName: "configuracion", schema }, {
    clave: { type: DataTypes.STRING(40), primaryKey: true },
    valor: { type: DataTypes.JSONB, allowNull: false },
    actualizado_por: usuario(true),
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora() },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora() },
  });
  await sequelize.query(`CREATE INDEX configuracion_actualizado_por ON ${schema}.configuracion (actualizado_por)`);

  await queryInterface.createTable({ tableName: "configuracion_cambio", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clave: { type: DataTypes.STRING(40), allowNull: false },
    valor_anterior: { type: DataTypes.JSONB, allowNull: true },
    valor_nuevo: { type: DataTypes.JSONB, allowNull: false },
    usuario_id: usuario(false),
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora() },
  });
  await sequelize.query(`CREATE INDEX configuracion_cambio_clave ON ${schema}.configuracion_cambio (clave, id DESC)`);
  await sequelize.query(`CREATE INDEX configuracion_cambio_usuario ON ${schema}.configuracion_cambio (usuario_id)`);
}

export async function down({ queryInterface, schema }) {
  await queryInterface.dropTable({ tableName: "configuracion_cambio", schema });
  await queryInterface.dropTable({ tableName: "configuracion", schema });
}
