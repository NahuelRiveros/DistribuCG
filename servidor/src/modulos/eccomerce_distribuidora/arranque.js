import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../core/database/sequelize.js";
import { sincronizarMarcasLegado } from "./services/marcas_distribuidora_service.js";

// Ajustes que corren en cada arranque DESPUÉS de sincronizar los modelos (necesitan
// las tablas y columnas ya creadas). Todos idempotentes.
export async function arranque_distribuidora() {
  await crear_indice_busqueda_productos();
  await backfill_pago_legado();
  await backfill_marcas_distribuidora();
}

/**
 * Índice de búsqueda de productos por nombre — el buscador del catálogo usa
 * `ILIKE '%texto%'` (comodín adelante, ver producto_distribuidora_service.js)
 * porque el usuario busca por cualquier parte del nombre, no solo el
 * principio; un índice B-tree normal no sirve para eso. pg_trgm + GIN sí.
 * No se declara en el array `indexes` del modelo porque esta versión de
 * Sequelize no soporta la clase de operador `gin_trgm_ops` ahí (generaría
 * el índice sin opclass y Postgres lo rechazaría) — se crea a mano acá.
 */
export async function crear_indice_busqueda_productos() {
  const [{ existe }] = await sequelize.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = '${DB_SCHEMA}' AND table_name = 'producto_distribuidora'
    ) AS existe
  `, { type: QueryTypes.SELECT });
  if (!existe) return;

  await sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
  // Si la extensión ya estaba en otro schema (uno viejo, o "extensions" en Supabase),
  // "IF NOT EXISTS" no la mueve y gin_trgm_ops no aparece en nuestro search_path:
  // se usa calificada con el schema donde realmente está.
  const [{ esquema }] = await sequelize.query(
    "SELECT n.nspname AS esquema FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm'",
    { type: QueryTypes.SELECT },
  );
  const esquemaSeguro = `"${esquema.replaceAll('"', '""')}"`;
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS producto_distribuidora_nombre_trgm_idx
    ON "${DB_SCHEMA}".producto_distribuidora USING gin (nombre ${esquemaSeguro}.gin_trgm_ops)
  `);
}

/**
 * nota_pedido reemplazó el booleano `pagado` por estado_pago/monto_pagado
 * (soporta pagos parciales, ver nota_pedido.js). Solo migra filas que siguen
 * en el default "pendiente/$0" que les puso el sync — una vez migrada una fila
 * no vuelve a tocarla, así que no pisa pagos parciales cargados después.
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

/**
 * Marcas en texto (antes de la tabla marca_distribuidora) → filas de la tabla y
 * marca_id en cada artículo, uniendo las repetidas por clave. Con todo migrado
 * es una sola consulta que no devuelve filas.
 */
async function backfill_marcas_distribuidora() {
  const { marcas, articulos } = await sincronizarMarcasLegado();
  if (articulos) console.log(`✅ Marcas migradas: ${marcas} marca(s), ${articulos} artículo(s)`);
}
