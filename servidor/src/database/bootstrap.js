import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "./sequelize.js";
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
  CarritoDistribuidora, CarritoDistribuidoraItem, NotaPedido, NotaPedidoItem,
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
  const modelos_en_orden = [
    // ── Catálogos — sin dependencias externas ────────────────────────────────
    Sexo, TipoDocumento, TipoPersona, AlumnoEstado, PlanTipo, Rol, Modulo,
    TipoEjercicio, GrupoMuscular, CategoriaProducto, Patologia, HomeArea,
    ModuloNegocio, HomeTexto, HomePilar, HomeContacto,

    // ── Nivel 1 — depende de catálogos ───────────────────────────────────────
    Permiso,        // permiso → modulo
    Persona,        // persona → sexo, tipo_documento, tipo_persona
    Producto,       // producto → categoria_producto
    Ejercicio,      // ejercicio → tipo_ejercicio, grupo_muscular
    HomeContenido,  // home_contenido → home_area

    // ── Nivel 2 — depende de persona ─────────────────────────────────────────
    RolPermiso,           // rol_permiso → rol, permiso
    Alumno,               // alumno → persona, alumno_estado
    Usuario,              // usuario → persona
    PacienteKinesiologia, // paciente_kinesiologia → persona

    // ── Nivel 3 — depende de alumno / usuario / paciente ─────────────────────
    UsuarioRol,             // usuario_rol → usuario, rol
    Membresia,              // membresia → alumno, plan_tipo, usuario
    MovimientoStock,        // movimiento_stock → producto, usuario
    AsignacionProfesional,  // asignacion_profesional → persona, usuario
    RegistroEjercicio,      // registro_ejercicio → persona, ejercicio, usuario
    PacientePatologia,      // paciente_patologia → paciente_kinesiologia, patologia
    AlumnoEstadoLog,        // alumno_estado_log → alumno, alumno_estado, usuario

    // ── Nivel 4 — depende de membresía / paciente_patologia ──────────────────
    Ingreso,             // ingreso → membresia
    FichaKinesiologica,  // ficha_kinesiologica → paciente_patologia, usuario

    // ── Nivel 5 — depende de ficha_kinesiologica ─────────────────────────────
    SesionKinesiologia, // sesion_kinesiologia → ficha_kinesiologica, usuario

    // ── Nivel 6 — depende de sesion_kinesiologia ─────────────────────────────
    RecordatorioKinesiologia, // recordatorio_kinesiologia → sesion_kinesiologia

    // ── productos/ — catálogo de tienda online (módulo eccomerce_indumentaria) ─
    // Catálogos sin dependencias externas (Categoria es auto-referenciada,
    // sync({alter:true}) la resuelve sola con la FK ya declarada en el modelo)
    Categoria, Marca, Talle, Color, EnvioOpcion, CondicionIva,
    ProductoTienda, // producto_tienda → categoria, marca
    Stock,          // stock → producto_tienda, talle, color

    // ── carrito/ — depende de usuario (ya sincronizado arriba) y producto_tienda ──
    Carrito,     // carrito → usuario
    CarritoItem, // carrito_item → carrito, producto_tienda, stock

    // ── distribuidora/ — catálogo tipo supermercado + nota de pedido (módulo
    // eccomerce_distribuidora). Tablas propias, sin depender de productos/ ni
    // carrito/ (indumentaria).
    CategoriaDistribuidora, // categoria_distribuidora (auto-referenciada)
    ProductoDistribuidora,  // producto_distribuidora → categoria_distribuidora
    VariedadDistribuidora,  // variedad_distribuidora → producto_distribuidora
    CarritoDistribuidora,     // carrito_distribuidora → usuario
    CarritoDistribuidoraItem, // carrito_distribuidora_item → carrito_distribuidora, producto_distribuidora, variedad_distribuidora
    NotaPedido,     // nota_pedido → usuario
    NotaPedidoItem, // nota_pedido_item → nota_pedido, producto_distribuidora, variedad_distribuidora
    PerfilClienteDistribuidora, // perfil_cliente_distribuidora → usuario
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
