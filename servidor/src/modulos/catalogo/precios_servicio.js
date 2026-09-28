import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../nucleo/db/sequelize.js";
import { idsConDescendientes, buscarCategoriaActiva } from "./categoria_servicio.js";

// Nuevo precio = precio × (100 + porcentaje) / 100, redondeado a centavos en la base.
// El precio anterior (oferta) se ajusta igual, para que la oferta siga siendo coherente.
const NUEVO = (columna) => `ROUND(${columna} * (100 + :porcentaje) / 100, 2)`;

async function alcance({ categoria_id }) {
  if (!categoria_id) return { filtro: "", reemplazos: {} };
  await buscarCategoriaActiva(categoria_id);
  return { filtro: "AND p.categoria_id IN (:categorias)", reemplazos: { categorias: await idsConDescendientes(categoria_id) } };
}

const DESDE = `FROM ${DB_SCHEMA}.variante v
  JOIN ${DB_SCHEMA}.producto p ON p.id = v.producto_id
  WHERE v.eliminado_en IS NULL AND p.eliminado_en IS NULL`;

/** Sube o baja por porcentaje todos los precios de una categoría (con subcategorías) o del catálogo. */
export async function ajustarPrecios({ porcentaje, categoria_id, simular }) {
  const { filtro, reemplazos } = await alcance({ categoria_id });
  const replacements = { porcentaje, ...reemplazos };

  if (simular) {
    const [{ cantidad }] = await sequelize.query(`SELECT COUNT(*)::int AS cantidad ${DESDE} ${filtro}`, { replacements, type: QueryTypes.SELECT });
    const ejemplos = await sequelize.query(
      `SELECT p.nombre AS producto, v.nombre AS presentacion, v.precio AS antes, ${NUEVO("v.precio")} AS despues, v.iva_porcentaje
       ${DESDE} ${filtro} ORDER BY p.nombre, v.orden LIMIT 5`,
      { replacements, type: QueryTypes.SELECT },
    );
    return { cantidad, ejemplos, aplicado: false };
  }

  const [, cantidad] = await sequelize.query(
    `UPDATE ${DB_SCHEMA}.variante AS v
     SET precio = ${NUEVO("v.precio")},
         precio_anterior = CASE WHEN v.precio_anterior IS NULL THEN NULL ELSE ${NUEVO("v.precio_anterior")} END,
         actualizado_en = now()
     FROM ${DB_SCHEMA}.producto p
     WHERE p.id = v.producto_id AND v.eliminado_en IS NULL AND p.eliminado_en IS NULL ${filtro}`,
    { replacements, type: QueryTypes.UPDATE },
  );
  return { cantidad, ejemplos: [], aplicado: true };
}
