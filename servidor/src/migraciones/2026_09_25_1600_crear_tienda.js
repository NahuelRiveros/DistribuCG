// Módulo tienda: datos de entrega, carrito, pedidos (con copia fija de cada línea),
// historial de estados y cobros. Basado en las notas de pedido de DistribuCG.

export async function up({ queryInterface, DataTypes, sequelize, schema }) {
  const sql = (texto) => sequelize.query(texto);
  const ahora = sequelize.literal("CURRENT_TIMESTAMP");
  const id = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };
  const fechas = {
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  };
  const ref = (tabla, onDelete, allowNull = false) => ({
    type: DataTypes.INTEGER,
    allowNull,
    references: { model: { tableName: tabla, schema }, key: "id" },
    onDelete,
  });
  const dinero = (extra = {}) => ({ type: DataTypes.DECIMAL(12, 2), allowNull: false, ...extra });

  // Datos de entrega y facturación del cliente (1 por usuario).
  await queryInterface.createTable({ tableName: "perfil_cliente", schema }, {
    id,
    usuario_id: { ...ref("usuario", "CASCADE"), unique: true },
    telefono: { type: DataTypes.STRING(40), allowNull: false },
    direccion: { type: DataTypes.STRING(200), allowNull: false },
    localidad: { type: DataTypes.STRING(100), allowNull: false },
    provincia: { type: DataTypes.STRING(60), allowNull: false },
    codigo_postal: { type: DataTypes.STRING(15), allowNull: true },
    indicaciones: { type: DataTypes.STRING(300), allowNull: true },
    razon_social: { type: DataTypes.STRING(150), allowNull: true },
    cuit: { type: DataTypes.STRING(11), allowNull: true },
    condicion_iva: { type: DataTypes.STRING(30), allowNull: true },
    ...fechas,
  });

  await queryInterface.createTable({ tableName: "carrito", schema }, {
    id,
    usuario_id: { ...ref("usuario", "CASCADE"), unique: true },
    ...fechas,
  });
  await queryInterface.createTable({ tableName: "carrito_item", schema }, {
    id,
    carrito_id: ref("carrito", "CASCADE"),
    variante_id: ref("variante", "RESTRICT"),
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio_al_agregar: dinero(), // para avisar si el precio cambió desde que se agregó
    ...fechas,
  });
  await sql(`ALTER TABLE ${schema}.carrito_item ADD CONSTRAINT carrito_item_cantidad_valida CHECK (cantidad > 0)`);
  await sql(`CREATE UNIQUE INDEX carrito_item_unico ON ${schema}.carrito_item (carrito_id, variante_id)`);
  await sql(`CREATE INDEX carrito_item_variante ON ${schema}.carrito_item (variante_id)`);

  // Operaciones que no se pueden duplicar (fusionar carrito, enviar pedido): misma clave = misma respuesta.
  await queryInterface.createTable({ tableName: "operacion_idempotente", schema }, {
    id,
    usuario_id: ref("usuario", "CASCADE"),
    clave: { type: DataTypes.STRING(60), allowNull: false },
    huella: { type: DataTypes.STRING(64), allowNull: false },
    respuesta: { type: DataTypes.JSONB, allowNull: false },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sql(`CREATE UNIQUE INDEX operacion_idempotente_unica ON ${schema}.operacion_idempotente (usuario_id, clave)`);

  await queryInterface.createTable({ tableName: "pedido", schema }, {
    id,
    usuario_id: ref("usuario", "RESTRICT"),
    estado: { type: DataTypes.STRING(20), allowNull: false }, // estados en proyecto.config.js → pedidos
    estado_cobro: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pendiente" },
    // Situación del stock del pedido: cada movimiento de stock pasa una sola vez.
    stock_fase: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "ninguna" },
    modalidad_entrega: { type: DataTypes.STRING(20), allowNull: false },
    entrega: { type: DataTypes.JSONB, allowNull: false }, // copia de los datos del cliente al enviar
    notas: { type: DataTypes.TEXT, allowNull: true },
    subtotal_neto: dinero(),
    total_iva: dinero(),
    total: dinero(),
    monto_cobrado: dinero({ defaultValue: 0 }),
    ...fechas,
  });
  await sql(`ALTER TABLE ${schema}.pedido
    ADD CONSTRAINT pedido_estado_cobro_valido CHECK (estado_cobro IN ('pendiente', 'parcial', 'cobrado')),
    ADD CONSTRAINT pedido_stock_fase_valida CHECK (stock_fase IN ('ninguna', 'reservado', 'descontado')),
    ADD CONSTRAINT pedido_importes_validos CHECK (subtotal_neto >= 0 AND total_iva >= 0 AND total >= 0 AND monto_cobrado >= 0 AND monto_cobrado <= total)`);
  await sql(`CREATE INDEX pedido_usuario ON ${schema}.pedido (usuario_id, creado_en DESC)`);
  await sql(`CREATE INDEX pedido_estado ON ${schema}.pedido (estado, creado_en DESC)`);
  await sql(`CREATE INDEX pedido_estado_cobro ON ${schema}.pedido (estado_cobro)`);

  await queryInterface.createTable({ tableName: "pedido_item", schema }, {
    id,
    pedido_id: ref("pedido", "CASCADE"),
    variante_id: ref("variante", "RESTRICT"),
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre_producto: { type: DataTypes.STRING(150), allowNull: false },
    presentacion: { type: DataTypes.STRING(100), allowNull: true },
    sku: { type: DataTypes.STRING(60), allowNull: true },
    precio_unitario: dinero(), // neto
    iva_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    precio_final_unitario: dinero(),
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    subtotal_final: dinero(),
    controla_stock: { type: DataTypes.BOOLEAN, allowNull: false }, // al momento del pedido
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sql(`ALTER TABLE ${schema}.pedido_item ADD CONSTRAINT pedido_item_cantidad_valida CHECK (cantidad > 0)`);
  await sql(`CREATE INDEX pedido_item_pedido ON ${schema}.pedido_item (pedido_id)`);
  await sql(`CREATE INDEX pedido_item_variante ON ${schema}.pedido_item (variante_id)`);

  await queryInterface.createTable({ tableName: "pedido_estado_log", schema }, {
    id,
    pedido_id: ref("pedido", "CASCADE"),
    estado_anterior: { type: DataTypes.STRING(20), allowNull: true },
    estado_nuevo: { type: DataTypes.STRING(20), allowNull: false },
    motivo: { type: DataTypes.STRING(500), allowNull: true },
    usuario_id: ref("usuario", "RESTRICT", true),
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
  });
  await sql(`CREATE INDEX pedido_estado_log_pedido ON ${schema}.pedido_estado_log (pedido_id, id)`);

  // Cobros: se anulan (con motivo y usuario), nunca se borran.
  await queryInterface.createTable({ tableName: "pedido_cobro", schema }, {
    id,
    pedido_id: ref("pedido", "RESTRICT"),
    monto: dinero(),
    metodo: { type: DataTypes.STRING(30), allowNull: false },
    nota: { type: DataTypes.STRING(255), allowNull: true },
    registrado_por: ref("usuario", "RESTRICT"),
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: ahora },
    anulado_en: { type: DataTypes.DATE, allowNull: true },
    anulado_por: ref("usuario", "RESTRICT", true),
    motivo_anulacion: { type: DataTypes.STRING(300), allowNull: true },
  });
  await sql(`ALTER TABLE ${schema}.pedido_cobro ADD CONSTRAINT pedido_cobro_monto_valido CHECK (monto > 0)`);
  await sql(`CREATE INDEX pedido_cobro_pedido ON ${schema}.pedido_cobro (pedido_id)`);
}

export async function down({ queryInterface, schema }) {
  for (const tabla of ["pedido_cobro", "pedido_estado_log", "pedido_item", "pedido", "operacion_idempotente", "carrito_item", "carrito", "perfil_cliente"]) {
    await queryInterface.dropTable({ tableName: tabla, schema });
  }
}
