// Categorías que se muestran en el menú de la tienda (cuando el cliente usa el menú por
// categorías, ej. indumentaria: Mujer / Hombre / Calzado). Las elige cada negocio en el panel.

export async function up({ queryInterface, DataTypes, schema }) {
  await queryInterface.addColumn({ tableName: "categoria", schema }, "en_menu", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
}

export async function down({ queryInterface, schema }) {
  await queryInterface.removeColumn({ tableName: "categoria", schema }, "en_menu");
}
