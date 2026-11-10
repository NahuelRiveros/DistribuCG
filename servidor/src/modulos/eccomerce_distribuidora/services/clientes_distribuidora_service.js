import { QueryTypes } from "sequelize";
import { sequelize, DB_SCHEMA } from "../../../core/database/sequelize.js";
import { normalizarPaginacion, armarPaginacion } from "../../../core/services/common/pagination.js";

export const CLIENTES_POR_PAGINA = 50;

// CLI-11: "datos completos" son los que exige el primer pedido (datosClienteCompletos). El formulario
// los valida al guardar (CUIT con dígito verificador incluido), así que en SQL alcanza con pedir que
// estén cargados: filtrar en la consulta mantiene una sola consulta paginada.
const COMPLETOS = `
  u.eliminado_en IS NULL
  AND btrim(coalesce(p.nombre, '')) <> '' AND btrim(coalesce(p.apellido, '')) <> '' AND btrim(coalesce(p.celular, '')) <> ''
  AND coalesce(pc.condicion_iva, '') <> '' AND coalesce(pc.cuit, '') <> ''
  AND btrim(coalesce(pc.direccion, '')) <> '' AND coalesce(pc.provincia, '') <> '' AND coalesce(pc.localidad, '') <> ''`;

/** Arma el filtro de búsqueda (CLI-12) con parámetros; nunca interpola lo que escribe el usuario. */
export function filtroClientes({ q, localidad } = {}) {
  const condiciones = [COMPLETOS];
  const replacements = {};
  const texto = String(q ?? "").trim().slice(0, 100);
  if (texto) {
    replacements.q = `%${texto}%`;
    // El CUIT se guarda con guiones: se compara solo con los números, escritos con o sin guiones.
    const digitos = texto.replace(/\D/g, "");
    if (digitos.length >= 3) replacements.doc = `%${digitos}%`;
    condiciones.push(`(p.nombre ILIKE :q OR p.apellido ILIKE :q OR (p.nombre || ' ' || p.apellido) ILIKE :q
      OR p.email ILIKE :q OR pc.razon_social ILIKE :q${replacements.doc ? " OR replace(pc.cuit, '-', '') LIKE :doc" : ""})`);
  }
  const loc = String(localidad ?? "").trim().slice(0, 100);
  if (loc) {
    replacements.localidad = loc;
    condiciones.push("pc.localidad = :localidad");
  }
  return { where: condiciones.join(" AND "), replacements };
}

export async function listarClientes({ q, localidad, pagina } = {}) {
  const s = `"${DB_SCHEMA}"`;
  const { page, limit, offset } = normalizarPaginacion({ page: pagina, limit: CLIENTES_POR_PAGINA, defaultLimit: CLIENTES_POR_PAGINA, maxLimit: CLIENTES_POR_PAGINA });
  const { where, replacements } = filtroClientes({ q, localidad });
  const desde = `FROM ${s}.perfil_cliente_distribuidora pc
    JOIN ${s}.usuario u ON u.id = pc.usuario_id
    JOIN ${s}.persona p ON p.id = u.persona_id`;
  const [filas, localidades] = await Promise.all([
    sequelize.query(`SELECT u.id AS usuario_id, p.nombre, p.apellido, p.email, p.celular,
        pc.razon_social, pc.condicion_iva, pc.cuit, pc.direccion, pc.provincia, pc.departamento, pc.localidad, pc.codigo_postal,
        (SELECT CAST(count(*) AS int) FROM ${s}.nota_pedido np WHERE np.usuario_id = u.id) AS cantidad_pedidos,
        CAST(count(*) OVER() AS int) AS total
      ${desde} WHERE ${where}
      ORDER BY p.apellido, p.nombre, u.id LIMIT :limit OFFSET :offset`,
    { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT }),
    sequelize.query(`SELECT DISTINCT pc.localidad ${desde} WHERE ${COMPLETOS} ORDER BY pc.localidad`, { type: QueryTypes.SELECT }),
  ]);
  const total = filas[0]?.total ?? 0;
  return {
    data: filas.map(({ total: _total, ...cliente }) => cliente),
    localidades: localidades.map((l) => l.localidad),
    ...armarPaginacion({ page, limit, total }),
  };
}
