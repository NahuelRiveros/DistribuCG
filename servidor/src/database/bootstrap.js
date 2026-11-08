import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "./sequelize.js";
import { calcularHashEsquema } from "./schema_hash.js";
import { modulosActivos } from "../modulos/index.js";
import {
  Sexo, TipoDocumento, TipoPersona, Rol, Modulo, HomeArea,
  Permiso, Persona, HomeContenido, RolPermiso, Usuario,
  UsuarioRol, ModuloNegocio, BannerAnuncio, HomeTexto, HomePilar, HomeContacto,
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
  await sincronizar_modelos_si_hace_falta();
  for (const modulo of modulosActivos) await modulo.arranque?.();
  console.log("✅ Bootstrap finalizado correctamente");
}

/**
 * sincronizar_modelos() hace un sync({alter:true}) por cada modelo — cada
 * uno le pregunta a Postgres cómo es la tabla hoy y compara contra la
 * definición, aunque no haya cambiado nada. Medido: ~2s para ~30 tablas
 * contra Postgres LOCAL (sin latencia de red); contra Neon en producción, y
 * sobre todo si el compute estaba en autosuspend, bastante más — y esto
 * corre en CADA boot del proceso, no solo después de un deploy con cambios
 * reales de schema.
 *
 * Guardamos un hash del contenido de los modelos (ver schema_hash.js) en una
 * tabla de 1 fila. Si no cambió desde el último boot exitoso, nos salteamos
 * sincronizar_modelos() entero. Si cambió (o es la primera vez, o algo
 * falló a mitad de camino la vez anterior) corremos el sync completo como
 * siempre y guardamos el hash nuevo — a prueba de olvidos: nunca hace falta
 * acordarse de "correr una migración", el resync se dispara solo con
 * cualquier cambio real en los modelos.
 */
async function sincronizar_modelos_si_hace_falta() {
  const hashActual = calcularHashEsquema();

  const filas = await sequelize.query(
    `SELECT hash FROM "${DB_SCHEMA}"."_schema_meta" WHERE id = 1`,
    { type: QueryTypes.SELECT }
  ).catch(() => []); // la tabla puede no existir todavía (primer boot)
  const hashGuardado = filas[0]?.hash ?? null;

  if (hashActual === hashGuardado) {
    console.log("⏭️  Modelos sin cambios — se omite sincronizar_modelos()");
    return;
  }

  await sincronizar_modelos();

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${DB_SCHEMA}"."_schema_meta" (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      hash TEXT NOT NULL,
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await sequelize.query(`
    INSERT INTO "${DB_SCHEMA}"."_schema_meta" (id, hash, actualizado_en)
    VALUES (1, :hash, now())
    ON CONFLICT (id) DO UPDATE SET hash = EXCLUDED.hash, actualizado_en = now()
  `, { replacements: { hash: hashActual } });
}

async function crear_schema() {
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`);
  console.log(`✅ Schema "${DB_SCHEMA}" listo`);
}

// Tablas de gimnasio, kinesiología, seguimiento de ejercicios, stock/kiosco e
// indumentaria: esos módulos se sacaron del proyecto (DistribuCG es solo distribuidora).
// Nombres fijos, solo en nuestro schema; IF EXISTS las hace idempotentes, así que corre
// en cada arranque sin costo. Primero las que dependen de otras.
export const TABLAS_RETIRADAS = [
  "recordatorio_kinesiologia", "sesion_kinesiologia", "ficha_kinesiologica",
  "paciente_patologia", "paciente_kinesiologia", "patologia",
  "sesion_kinesiologica_ejercicio", "sesion_kinesiologica", "rutina_ejercicio",
  "test_funcional", "test_fuerza", "registro_sesion_kinesiologia",
  "registro_ejercicio", "asignacion_profesional", "ejercicio", "grupo_muscular", "tipo_ejercicio",
  "ingreso", "alumno_estado_log", "membresia", "alumno", "plan_tipo", "alumno_estado",
  "movimiento_stock", "producto", "categoria_producto",
  "carrito_item", "carrito", "stock", "producto_tienda",
  "talle", "color", "marca", "categoria", "envio_opcion", "condicion_iva",
];
export const MODULOS_RETIRADOS = ["gym", "kinesiologia", "stock", "eccomerce_indumentaria"];

/**
 * Ajustes que `sync({ alter: true })` no resuelve solo. Cada uno es idempotente
 * para poder correr en cada boot.
 */
export async function aplicar_ajustes_puntuales() {
  for (const tabla of TABLAS_RETIRADAS) {
    await sequelize.query(`DROP TABLE IF EXISTS "${DB_SCHEMA}"."${tabla}" CASCADE`);
  }
  // Ya no aparecen en "Módulos habilitados" del super admin. La tabla puede no
  // existir todavía en el primer arranque (la crea el sync de más abajo).
  await sequelize.query(`DELETE FROM "${DB_SCHEMA}".modulo_negocio WHERE codigo IN (:codigos)`, { replacements: { codigos: MODULOS_RETIRADOS } })
    .catch((error) => { if (error.parent?.code !== "42P01") throw error; });
}

async function sincronizar_modelos() {
  // MODELOS_COMPARTIDOS va siempre primero (todo lo demás depende de
  // Persona/Usuario/Rol/Home); dentro de cada lista el orden respeta sus FK.

  const MODELOS_COMPARTIDOS = [
    // catálogos sin dependencias externas
    Sexo, TipoDocumento, TipoPersona, Rol, Modulo, ModuloNegocio, BannerAnuncio,
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

  // Cada módulo de rubro trae sus modelos ya ordenados (ver su modulo.js); solo
  // se sincronizan los de los módulos activos en gate_config.js.
  const modelos_en_orden = [
    ...MODELOS_COMPARTIDOS,
    ...modulosActivos.flatMap((modulo) => modulo.modelos),
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
