// Usuarios, roles y la tabla puente. Base del módulo usuarios (siempre activo).

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const ahora = sequelize.literal("CURRENT_TIMESTAMP");
  const fechas = {
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  };

  await queryInterface.createTable({ tableName: "rol", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING(150), allowNull: false },
    ...fechas,
  });

  await queryInterface.createTable({ tableName: "usuario", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    apellido: { type: DataTypes.STRING(80), allowNull: true },
    // Siempre en minúsculas (lo normaliza el schema Zod antes de guardar)
    email: { type: DataTypes.STRING(150), allowNull: false },
    contrasena: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ultimo_login: { type: DataTypes.DATE, allowNull: true },
    ...fechas,
    eliminado_en: { type: DataTypes.DATE, allowNull: true },
  });
  // Único solo entre usuarios no eliminados: un email dado de baja se puede volver a registrar.
  await sequelize.query(
    `CREATE UNIQUE INDEX usuario_email_unico ON ${schema}.usuario (email) WHERE eliminado_en IS NULL`,
  );

  await queryInterface.createTable({ tableName: "usuario_rol", schema }, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "usuario", schema }, key: "id" },
      onDelete: "CASCADE",
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "rol", schema }, key: "id" },
      onDelete: "RESTRICT",
    },
    ...fechas,
  });
  await queryInterface.addIndex({ tableName: "usuario_rol", schema }, ["usuario_id", "rol_id"], {
    unique: true,
    name: "usuario_rol_unico",
  });
  await queryInterface.addIndex({ tableName: "usuario_rol", schema }, ["rol_id"], { name: "usuario_rol_rol_id" });
}

export async function down({ queryInterface, schema }) {
  await queryInterface.dropTable({ tableName: "usuario_rol", schema });
  await queryInterface.dropTable({ tableName: "usuario", schema });
  await queryInterface.dropTable({ tableName: "rol", schema });
}
