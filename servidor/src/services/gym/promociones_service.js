import { sequelize } from "../../database/sequelize.js";
import { QueryTypes } from "sequelize";

export const FILTROS = {
  todos:    "",
  activos:  "AND a.estado_id = 1",
  vencidos: "AND a.estado_id != 1",
};

export async function obtenerDestinatariosEmail(filtro = "todos") {
  const where = FILTROS[filtro] ?? "";
  const rows = await sequelize.query(
    `SELECT
       p.nombre    AS nombre,
       p.apellido  AS apellido,
       p.email     AS email,
       p.celular   AS celular
     FROM alumno a
     JOIN persona p ON p.id = a.persona_id
     WHERE p.email IS NOT NULL
       AND p.email <> ''
       ${where}
     ORDER BY p.apellido, p.nombre`,
    { type: QueryTypes.SELECT }
  );
  return rows;
}

export async function obtenerDestinatariosCelular(filtro = "todos") {
  const where = FILTROS[filtro] ?? "";
  const rows = await sequelize.query(
    `SELECT
       p.nombre    AS nombre,
       p.apellido  AS apellido,
       p.celular   AS celular
     FROM alumno a
     JOIN persona p ON p.id = a.persona_id
     WHERE p.celular IS NOT NULL
       ${where}
     ORDER BY p.apellido`,
    { type: QueryTypes.SELECT }
  );

  return rows
    .map((r) => String(r.celular).replace(/\D/g, ""))
    .filter((n) => n.length >= 8);
}
