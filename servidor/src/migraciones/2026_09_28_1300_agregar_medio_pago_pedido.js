// El pedido guarda con qué medio dijo el cliente que iba a pagar y el descuento que se le
// aplicó por ese medio (ej. 10% por transferencia). `total` pasa a ser el total YA descontado:
// subtotal_neto + total_iva - descuento = total. Los pedidos anteriores quedan sin medio y con descuento 0.

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const tabla = { tableName: "pedido", schema };
  await queryInterface.addColumn(tabla, "medio_pago", { type: DataTypes.STRING(30), allowNull: true });
  await queryInterface.addColumn(tabla, "descuento", { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 });
  await sequelize.query(`ALTER TABLE ${schema}.pedido
    ADD CONSTRAINT pedido_descuento_valido CHECK (descuento >= 0 AND descuento <= subtotal_neto + total_iva),
    ADD CONSTRAINT pedido_total_cuadra CHECK (total = subtotal_neto + total_iva - descuento)`);
}

export async function down({ queryInterface, sequelize, schema }) {
  await sequelize.query(`ALTER TABLE ${schema}.pedido DROP CONSTRAINT pedido_total_cuadra, DROP CONSTRAINT pedido_descuento_valido`);
  await queryInterface.removeColumn({ tableName: "pedido", schema }, "descuento");
  await queryInterface.removeColumn({ tableName: "pedido", schema }, "medio_pago");
}
