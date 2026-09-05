import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "./sequelize.js";
import { projectModules } from "../configuracion_servidor/gate_config.js";
import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, PlanTipo, Rol, Modulo,
  TipoEjercicio, GrupoMuscular, CategoriaProducto, Patologia, HomeArea,
  Permiso, Persona, Producto, Ejercicio, HomeContenido,
  RolPermiso, Alumno, Usuario, PacienteKinesiologia,
  UsuarioRol, Membresia, MovimientoStock, AsignacionProfesional,
  RegistroEjercicio, PacientePatologia, AlumnoEstadoLog,
  FichaKinesiologica, SesionKinesiologia, RecordatorioKinesiologia,
  Ingreso, ModuloNegocio, HomeTexto, HomePilar, HomeContacto,
  Categoria, Marca, Talle, Color, ProductoTienda, Stock, EnvioOpcion, CondicionIva,
  Carrito, CarritoItem,
  CategoriaDistribuidora, ProductoDistribuidora, VariedadDistribuidora,
  CarritoDistribuidora, CarritoDistribuidoraItem, NotaPedido, NotaPedidoItem, NotaPedidoPago,
  PerfilClienteDistribuidora,
} from "../models/index.js";

/**
 * Crea el schema y todas las tablas desde cero a partir de los modelos
 * Sequelize — no depende de archivos .sql de migración.
 * Idempotente: correr sobre una base ya creada solo aplica los ALTER
 * necesarios (nuevas columnas, índices, etc.).
 */
export async function bootstrap_database() {
  console.log("🛠️  Iniciando bootstrap...");
  await crear_schema();
  await aplicar_ajustes_puntuales();
  await sincronizar_modelos();
  await backfill_pago_legado();
  console.log("✅ Bootstrap finalizado correctamente");
}

async function crear_schema() {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`);
  console.log(`✅ Schema "${DB_SCHEMA}" listo`);
}

/**
 * Ajustes puntuales que `sync({ alter: true })` no resuelve solo (ej. cambiar
 * la definición de un índice único ya existente). Cada entrada debe ser
 * idempotente (IF EXISTS / IF NOT EXISTS) para poder correr en cada boot.
 */
async function aplicar_ajustes_puntuales() {
  // asignacion_profesional: el único activo pasó de ser por persona_id a
  // ser por (persona_id, tipo) — así una persona puede tener a la vez un
  // profesor de gym y un kinesiólogo asignados. sync({ alter:true }) no
  // reemplaza índices con distinta definición, así que se borra a mano.
  await sequelize.query(
    `DROP INDEX IF EXISTS "${DB_SCHEMA}".asignacion_profesional_persona_activa_unq`
  );

  // Kinesiología: se reemplazó todo el sistema de rutina de ejercicios +
  // sesiones con escalas de dolor/RIR por sesion_kinesiologia (visita) +
  // recordatorio_kinesiologia (días + observación colgando de la visita) —
  // estas tablas ya no se sincronizan y se eliminan (confirmado con el
  // cliente, sin datos que preservar). IF EXISTS + CASCADE hace la
  // operación idempotente.
  for (const tabla of [
    "sesion_kinesiologica_ejercicio",
    "sesion_kinesiologica",
    "rutina_ejercicio",
    "test_funcional",
    "test_fuerza",
    "registro_sesion_kinesiologia",
  ]) {
    await sequelize.query(`DROP TABLE IF EXISTS "${DB_SCHEMA}".${tabla} CASCADE`);
  }

  // recordatorio_kinesiologia cambió de esquema durante el desarrollo: la
  // primera versión colgaba directo de ficha_id, la definitiva cuelga de
  // sesion_id (ver sesion_kinesiologia.js). sync({alter:true}) no dropea
  // columnas viejas por sí solo, así que si la tabla todavía tiene el
  // esquema anterior (sin sesion_id) se dropea UNA sola vez para que el
  // sync de abajo la recree bien — no hay datos reales cargados todavía
  // con el esquema viejo. Una vez migrada, esta condición no vuelve a
  // cumplirse, así que no borra datos futuros.
  const [{ existe }] = await sequelize.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'recordatorio_kinesiologia' AND column_name = 'sesion_id'
    ) AS existe
  `, { type: QueryTypes.SELECT });
  if (!existe) {
    await sequelize.query(`DROP TABLE IF EXISTS "${DB_SCHEMA}".recordatorio_kinesiologia CASCADE`);
  }
}

async function sincronizar_modelos() {
  // Agrupado por rubro/módulo — mismos nombres que projectModules en
  // frontend/src/config/gate_config.js y que MODULOS en
  // scripts/analizar_modulos.mjs, para que los tres archivos se lean juntos.
  //
  // Regla de orden: MODELOS_COMPARTIDOS va siempre primero (todo lo demás
  // depende de Persona/Usuario/Rol/Home). Dentro de cada lista de rubro el
  // orden interno importa (respeta sus propias FK, ver comentarios). Entre
  // listas de rubros distintos el orden no importa — son independientes —
  // con una sola excepción: MODELOS_PRODUCTOS antes que MODELOS_CARRITO,
  // porque carrito_item → producto_tienda/stock (misma vertical
  // eccomerce_indumentaria, separadas en dos listas nomás por prolijidad).

  const MODELOS_COMPARTIDOS = [
    // catálogos sin dependencias externas
    Sexo, TipoDocumento, TipoPersona, Rol, Modulo, ModuloNegocio,
    HomeArea, HomeTexto, HomePilar, HomeContacto,
    // nivel 1
    Permiso,       // permiso → modulo
    Persona,       // persona → sexo, tipo_documento, tipo_persona
    HomeContenido, // home_contenido → home_area
    // nivel 2
    RolPermiso, // rol_permiso → rol, permiso
    Usuario,    // usuario → persona
    // nivel 3
    UsuarioRol, // usuario_rol → usuario, rol
  ];

  const MODELOS_GYM = [
    AlumnoEstado, PlanTipo, // catálogos propios
    Alumno,          // alumno → persona, alumno_estado
    Membresia,       // membresia → alumno, plan_tipo, usuario
    AlumnoEstadoLog, // alumno_estado_log → alumno, alumno_estado, usuario
    Ingreso,         // ingreso → membresia
  ];

  const MODELOS_KINESIOLOGIA = [
    Patologia, // catálogo propio
    PacienteKinesiologia,     // paciente_kinesiologia → persona
    PacientePatologia,        // paciente_patologia → paciente_kinesiologia, patologia
    FichaKinesiologica,       // ficha_kinesiologica → paciente_patologia, usuario
    SesionKinesiologia,       // sesion_kinesiologia → ficha_kinesiologica, usuario
    RecordatorioKinesiologia, // recordatorio_kinesiologia → sesion_kinesiologia
  ];

  // módulo "stock" (carpeta models/kiosco/) — backend completo pero sin
  // pantalla propia en el frontend todavía, ver gate_config.js.
  const MODELOS_STOCK = [
    CategoriaProducto, // catálogo propio
    Producto,          // producto → categoria_producto
    MovimientoStock,   // movimiento_stock → producto, usuario
  ];

  // carpeta models/seguimiento/ — sin service/controller/route ni gate en
  // modulo_negocio (ver advertencia de scripts/analizar_modulos.mjs). Se
  // sigue sincronizando para no perder las tablas si ya tienen datos, pero
  // no pertenece a ningún módulo activo hoy.
  const MODELOS_SEGUIMIENTO = [
    TipoEjercicio, GrupoMuscular, // catálogos propios
    Ejercicio,             // ejercicio → tipo_ejercicio, grupo_muscular
    AsignacionProfesional, // asignacion_profesional → persona, usuario
    RegistroEjercicio,     // registro_ejercicio → persona, ejercicio, usuario
  ];

  // módulo eccomerce_indumentaria — catálogo de tienda online
  const MODELOS_PRODUCTOS = [
    // Categoria es auto-referenciada, sync({alter:true}) la resuelve sola
    // con la FK ya declarada en el modelo
    Categoria, Marca, Talle, Color, EnvioOpcion, CondicionIva,
    ProductoTienda, // producto_tienda → categoria, marca
    Stock,          // stock → producto_tienda, talle, color
  ];

  // módulo eccomerce_indumentaria — carrito (depende de MODELOS_PRODUCTOS)
  const MODELOS_CARRITO = [
    Carrito,     // carrito → usuario
    CarritoItem, // carrito_item → carrito, producto_tienda, stock
  ];

  // módulo eccomerce_distribuidora — catálogo tipo supermercado + nota de
  // pedido. Tablas propias, sin depender de productos/ ni carrito/ (indumentaria).
  const MODELOS_DISTRIBUIDORA = [
    CategoriaDistribuidora, // categoria_distribuidora (auto-referenciada)
    ProductoDistribuidora,  // producto_distribuidora → categoria_distribuidora
    VariedadDistribuidora,  // variedad_distribuidora → producto_distribuidora
    CarritoDistribuidora,     // carrito_distribuidora → usuario
    CarritoDistribuidoraItem, // carrito_distribuidora_item → carrito_distribuidora, producto_distribuidora, variedad_distribuidora
    NotaPedido,     // nota_pedido → usuario
    NotaPedidoItem, // nota_pedido_item → nota_pedido, producto_distribuidora, variedad_distribuidora
    NotaPedidoPago, // nota_pedido_pago → nota_pedido, usuario
    PerfilClienteDistribuidora, // perfil_cliente_distribuidora → usuario
  ];

  // Mismo gate que decide navbar/rutas del lado del frontend
  // (frontend/src/config/gate_config.js, ver navbar_config/main.js) — acá
  // decide qué tablas se crean. Un módulo en `false` no sincroniza sus
  // modelos: si el deploy es de un cliente que solo usa distribuidora, no
  // se crean las tablas de gym/kinesiología/indumentaria. MODELOS_COMPARTIDOS
  // va siempre. MODELOS_SEGUIMIENTO no tiene módulo propio en el gate (ver
  // comentario arriba) así que también va siempre, hasta que se le asigne uno.
  const modelos_en_orden = [
    ...MODELOS_COMPARTIDOS,
    ...MODELOS_SEGUIMIENTO,
    ...(projectModules.gym ? MODELOS_GYM : []),
    ...(projectModules.kinesiologia ? MODELOS_KINESIOLOGIA : []),
    ...(projectModules.stock ? MODELOS_STOCK : []),
    ...(projectModules.eccomerce_indumentaria ? [...MODELOS_PRODUCTOS, ...MODELOS_CARRITO] : []),
    ...(projectModules.eccomerce_distribuidora ? MODELOS_DISTRIBUIDORA : []),
  ];

  for (const modelo of modelos_en_orden) {
    try {
      await modelo.sync({ alter: true });
      console.log(`✅ Tabla sincronizada: ${modelo.tableName}`);
    } catch (error) {
      console.error(`❌ Error en tabla ${modelo.tableName}:`, error.message);
      throw error;
    }
  }
}

/**
 * nota_pedido reemplazó el booleano `pagado` por estado_pago/monto_pagado
 * (soporta pagos parciales, ver nota_pedido.js). Corre DESPUÉS de
 * sincronizar_modelos() porque necesita que las columnas nuevas ya existan.
 * Idempotente: solo migra filas que siguen en el default "pendiente/$0" que
 * les puso el sync recién — una vez migrada una fila no vuelve a tocarla,
 * así que no pisa pagos parciales cargados después con el sistema nuevo.
 * No dropea la columna `pagado` vieja (evita DDL destructivo en un boot
 * automático) — queda huérfana e inofensiva hasta que alguien la borre a mano.
 */
async function backfill_pago_legado() {
  const [{ existe }] = await sequelize.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'nota_pedido' AND column_name = 'pagado'
    ) AS existe
  `, { type: QueryTypes.SELECT });
  if (!existe) return;

  await sequelize.query(`
    UPDATE "${DB_SCHEMA}".nota_pedido
    SET estado_pago = CASE WHEN pagado THEN 'pagado' ELSE 'pendiente' END,
        monto_pagado = CASE WHEN pagado THEN total ELSE 0 END
    WHERE estado_pago = 'pendiente' AND monto_pagado = 0
  `);
}
