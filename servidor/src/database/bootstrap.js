import { sequelize, DB_SCHEMA } from "./sequelize.js";
import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, PlanTipo, Rol, Modulo,
  TipoEjercicio, GrupoMuscular, CategoriaProducto, Patologia, HomeArea,
  Permiso, Persona, Producto, Ejercicio, HomeContenido,
  RolPermiso, Alumno, Usuario, PacienteKinesiologia,
  UsuarioRol, Membresia, MovimientoStock, AsignacionProfesional,
  RegistroEjercicio, PacientePatologia, AlumnoEstadoLog,
  Ingreso,
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
  await sincronizar_modelos();
  console.log("✅ Bootstrap finalizado correctamente");
}

async function crear_schema() {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`);
  console.log(`✅ Schema "${DB_SCHEMA}" listo`);
}

async function sincronizar_modelos() {
  const modelos_en_orden = [
    // ── Catálogos — sin dependencias externas ────────────────────────────────
    Sexo, TipoDocumento, TipoPersona, AlumnoEstado, PlanTipo, Rol, Modulo,
    TipoEjercicio, GrupoMuscular, CategoriaProducto, Patologia, HomeArea,

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

    // ── Nivel 4 — depende de membresía ───────────────────────────────────────
    Ingreso,   // ingreso → membresia
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
