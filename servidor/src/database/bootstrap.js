import { sequelize, DB_SCHEMA } from "./sequelize.js";
import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, PlanTipo, Rol, Modulo,
  TipoEjercicio, GrupoMuscular, CategoriaProducto, Patologia, HomeArea,
  Permiso, Persona, Producto, Ejercicio, HomeContenido,
  RolPermiso, Alumno, Usuario, PacienteKinesiologia,
  UsuarioRol, Membresia, MovimientoStock, AsignacionProfesional,
  RegistroEjercicio, PacientePatologia, AlumnoEstadoLog,
  FichaKinesiologica, TestFuncional, TestFuerza, RegistroSesionKinesiologia,
  SesionKinesiologica, SesionKinesiologicaEjercicio, RutinaEjercicio,
  Ingreso, ModuloNegocio, HomeTexto, HomePilar, HomeContacto,
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
    TestFuncional,              // test_funcional → ficha_kinesiologica, ejercicio, usuario
    TestFuerza,                 // test_fuerza → ficha_kinesiologica, ejercicio, usuario
    RegistroSesionKinesiologia, // registro_sesion_kinesiologia → ficha_kinesiologica, ejercicio, usuario — histórico, congelada, no se le quita el sync para no perder la tabla
    SesionKinesiologica,        // sesion_kinesiologica → ficha_kinesiologica, usuario
    RutinaEjercicio,            // rutina_ejercicio → ficha_kinesiologica, ejercicio

    // ── Nivel 6 — depende de sesion_kinesiologica ────────────────────────────
    SesionKinesiologicaEjercicio, // sesion_kinesiologica_ejercicio → sesion_kinesiologica, ejercicio
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
