// =============================================================
// services/generic_service.js
// Capa genérica reutilizable sobre Sequelize para operaciones CRUD/ABM.
//
// CUÁNDO USARLO:
//   ✅ Catálogos simples (roles, tipos, estados)
//   ✅ Tablas maestras con baja lógica
//   ✅ Listados administrativos con filtros y paginación
//   ✅ ABM de una sola entidad sin lógica de negocio compleja
//
// CUÁNDO NO USARLO (escribir tu propio service):
//   ❌ Auth / login / sesiones
//   ❌ Registro con múltiples tablas (usar sequelize.transaction)
//   ❌ Cálculos, acumuladores, totales
//   ❌ Workflows con estados
//   ❌ Reportes PDF / exportaciones
//   ❌ Operaciones con muchas reglas de negocio
//   ❌ Transacciones críticas complejas
// =============================================================

import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";

// =============================================================
// LISTAR TODOS
// =============================================================

/**
 * Devuelve todos los registros que coincidan con los filtros dados.
 *
 * @param {object}   opts
 * @param {Model}    opts.model          - Modelo Sequelize (requerido)
 * @param {object}   [opts.where={}]     - Condiciones WHERE
 * @param {string[]} [opts.attributes]   - Columnas a seleccionar
 * @param {object[]} [opts.include]      - Joins (asociaciones Sequelize)
 * @param {Array}    [opts.order]        - Orden: [["col","ASC"]]
 * @param {object}   [opts.transaction]  - Transacción Sequelize
 * @param {boolean}  [opts.raw]          - true → retorna objetos planos JS
 * @param {boolean}  [opts.nest]         - true → anida columnas con alias (útil con raw)
 * @param {boolean}  [opts.paranoid]     - false → incluye registros soft-deleted (si aplica)
 * @param {Function} [opts.logging]      - función de log SQL personalizada
 */
export async function listarGenerico({
  model,
  where      = {},
  attributes,
  include,
  order,
  transaction,
  raw,
  nest,
  paranoid,
  logging,
} = {}) {
  validarModelo(model);

  return await model.findAll({
    where,
    ...(attributes   !== undefined && { attributes }),
    ...(include      !== undefined && { include }),
    ...(order        !== undefined && { order }),
    ...(transaction  !== undefined && { transaction }),
    ...(raw          !== undefined && { raw }),
    ...(nest         !== undefined && { nest }),
    ...(paranoid     !== undefined && { paranoid }),
    ...(logging      !== undefined && { logging }),
  });
}

// =============================================================
// LISTAR CON PAGINACIÓN
// =============================================================

/**
 * Devuelve registros paginados + el total para construir la paginación.
 *
 * @param {object}   opts
 * @param {Model}    opts.model
 * @param {object}   [opts.where={}]
 * @param {string[]} [opts.attributes]
 * @param {object[]} [opts.include]
 * @param {Array}    [opts.order]
 * @param {number}   opts.limit          - Registros por página (requerido)
 * @param {number}   opts.offset         - Desplazamiento (requerido)
 * @param {object}   [opts.transaction]
 * @param {boolean}  [opts.distinct]     - true (default) → count correcto con joins N:M
 * @param {Array}    [opts.group]        - GROUP BY
 * @param {object}   [opts.having]       - HAVING (requiere group)
 * @param {boolean}  [opts.raw]
 * @param {boolean}  [opts.nest]
 * @param {boolean}  [opts.paranoid]
 * @param {Function} [opts.logging]
 * @returns {{ rows: object[], count: number }}
 */
export async function paginadoGenerico({
  model,
  where      = {},
  attributes,
  include,
  order,
  limit,
  offset,
  transaction,
  distinct   = true,
  group,
  having,
  raw,
  nest,
  paranoid,
  logging,
} = {}) {
  validarModelo(model);

  return await model.findAndCountAll({
    where,
    limit,
    offset,
    distinct,
    ...(attributes  !== undefined && { attributes }),
    ...(include     !== undefined && { include }),
    ...(order       !== undefined && { order }),
    ...(transaction !== undefined && { transaction }),
    ...(group       !== undefined && { group }),
    ...(having      !== undefined && { having }),
    ...(raw         !== undefined && { raw }),
    ...(nest        !== undefined && { nest }),
    ...(paranoid    !== undefined && { paranoid }),
    ...(logging     !== undefined && { logging }),
  });
}

// =============================================================
// BUSCAR UNO (findOne)
// =============================================================

/**
 * Devuelve el primer registro que coincida con el where.
 * Retorna null si no existe (NO lanza error).
 */
export async function buscarUnoGenerico({
  model,
  where      = {},
  attributes,
  include,
  order,
  transaction,
  paranoid,
  logging,
} = {}) {
  validarModelo(model);

  return await model.findOne({
    where,
    ...(attributes  !== undefined && { attributes }),
    ...(include     !== undefined && { include }),
    ...(order       !== undefined && { order }),
    ...(transaction !== undefined && { transaction }),
    ...(paranoid    !== undefined && { paranoid }),
    ...(logging     !== undefined && { logging }),
  });
}

// =============================================================
// BUSCAR POR PK
// =============================================================

/**
 * Busca un registro por su clave primaria.
 * Retorna null si no existe.
 */
export async function buscarPorIdGenerico({
  model,
  id,
  attributes,
  include,
  transaction,
  paranoid,
  logging,
} = {}) {
  validarModelo(model);
  validarId(id);

  return await model.findByPk(id, {
    ...(attributes  !== undefined && { attributes }),
    ...(include     !== undefined && { include }),
    ...(transaction !== undefined && { transaction }),
    ...(paranoid    !== undefined && { paranoid }),
    ...(logging     !== undefined && { logging }),
  });
}

// =============================================================
// BUSCAR POR TEXTO (Op.iLike — PostgreSQL)
// =============================================================

/**
 * Filtra registros donde alguno de los campos dados contenga el texto.
 * Soporta un campo (string) o múltiples campos (array).
 *
 * @param {object}          opts
 * @param {Model}           opts.model
 * @param {string|string[]} opts.campoBusqueda   - Campo/s donde buscar
 * @param {string}          opts.texto           - Texto a buscar (parcial)
 * @param {object}          [opts.whereExtra={}] - Condiciones adicionales (ej: activos)
 * @param {string[]}        [opts.attributes]
 * @param {Array}           [opts.order]
 * @param {object}          [opts.transaction]
 */
export async function buscarPorTextoGenerico({
  model,
  campoBusqueda,
  texto,
  whereExtra = {},
  attributes,
  order,
  transaction,
} = {}) {
  validarModelo(model);

  if (!campoBusqueda) throw new Error("campoBusqueda es requerido en buscarPorTextoGenerico");
  if (!texto)         throw new Error("texto es requerido en buscarPorTextoGenerico");

  const textoBusqueda = String(texto).trim();
  const campos        = Array.isArray(campoBusqueda) ? campoBusqueda : [campoBusqueda];

  return await model.findAll({
    where: {
      ...whereExtra,
      [Op.or]: campos.map((campo) => ({
        [campo]: { [Op.iLike]: `%${textoBusqueda}%` },
      })),
    },
    ...(attributes  !== undefined && { attributes }),
    ...(order       !== undefined && { order }),
    ...(transaction !== undefined && { transaction }),
  });
}

// =============================================================
// CONTAR
// =============================================================

/**
 * Cuenta los registros que coincidan con el where.
 */
export async function contarGenerico({
  model,
  where       = {},
  transaction,
  distinct,
  col,
} = {}) {
  validarModelo(model);

  return await model.count({
    where,
    ...(transaction !== undefined && { transaction }),
    ...(distinct    !== undefined && { distinct }),
    ...(col         !== undefined && { col }),
  });
}

// =============================================================
// CREAR
// =============================================================

/**
 * Crea un nuevo registro.
 *
 * @param {object} opts
 * @param {Model}  opts.model
 * @param {object} opts.datos       - Campos a insertar
 * @param {object} [opts.transaction]
 * @returns {object} Instancia Sequelize creada
 */
export async function crearGenerico({ model, datos, transaction } = {}) {
  validarModelo(model);

  if (!datos || typeof datos !== "object" || Object.keys(datos).length === 0) {
    throw new Error("datos es requerido en crearGenerico");
  }

  return await model.create(datos, {
    ...(transaction !== undefined && { transaction }),
  });
}

// =============================================================
// ACTUALIZAR
// =============================================================

/**
 * Actualiza un registro buscándolo primero por PK.
 * Retorna null si no existe (el controller maneja el 404).
 *
 * @param {object}        opts
 * @param {Model}         opts.model
 * @param {number|string} opts.id       - PK del registro
 * @param {object}        opts.datos    - Campos a actualizar
 * @param {object}        [opts.transaction]
 * @returns {object|null}
 */
export async function actualizarGenerico({ model, id, datos, transaction } = {}) {
  validarModelo(model);
  validarId(id);

  if (!datos || typeof datos !== "object" || Object.keys(datos).length === 0) {
    throw new Error("datos es requerido en actualizarGenerico");
  }

  const registro = await model.findByPk(id, {
    ...(transaction !== undefined && { transaction }),
  });

  if (!registro) return null;

  await registro.update(datos, {
    ...(transaction !== undefined && { transaction }),
  });

  return registro;
}

// =============================================================
// BAJA LÓGICA (soft delete manual por campo FECHABAJA)
// =============================================================

/**
 * Setea campoFechaBaja = NOW() sin eliminar el registro.
 *
 * @param {object}        opts
 * @param {Model}         opts.model
 * @param {number|string} opts.id
 * @param {string}        opts.campoFechaBaja - Nombre de la columna (ej: "AUTH02_FECHABAJA")
 * @param {object}        [opts.transaction]
 * @returns {object|null}
 */
export async function bajaLogicaGenerico({ model, id, campoFechaBaja, transaction } = {}) {
  validarModelo(model);
  validarId(id);

  if (!campoFechaBaja) throw new Error("campoFechaBaja es requerido en bajaLogicaGenerico");

  const registro = await model.findByPk(id, {
    ...(transaction !== undefined && { transaction }),
  });

  if (!registro) return null;

  await registro.update(
    { [campoFechaBaja]: new Date() },
    { ...(transaction !== undefined && { transaction }) }
  );

  return registro;
}

// =============================================================
// REACTIVAR (deshacer baja lógica)
// =============================================================

/**
 * Setea campoFechaBaja = null para reactivar el registro.
 */
export async function reactivarGenerico({ model, id, campoFechaBaja, transaction } = {}) {
  validarModelo(model);
  validarId(id);

  if (!campoFechaBaja) throw new Error("campoFechaBaja es requerido en reactivarGenerico");

  const registro = await model.findByPk(id, {
    ...(transaction !== undefined && { transaction }),
  });

  if (!registro) return null;

  await registro.update(
    { [campoFechaBaja]: null },
    { ...(transaction !== undefined && { transaction }) }
  );

  return registro;
}

// =============================================================
// ELIMINACIÓN FÍSICA (hard delete) — PROTEGIDA
// =============================================================

/**
 * Elimina físicamente un registro.
 * ⚠️  Requiere allowHardDelete: true en la configuración.
 *
 * @param {object}        opts
 * @param {Model}         opts.model
 * @param {number|string} opts.id
 * @param {boolean}       opts.allowHardDelete  - Debe ser true explícitamente
 * @param {object}        [opts.transaction]
 * @returns {boolean} true si se eliminó, false si no existía
 */
export async function eliminarFisicoGenerico({
  model,
  id,
  allowHardDelete = false,
  transaction,
} = {}) {
  validarModelo(model);
  validarId(id);

  if (!allowHardDelete) {
    throw new Error("Hard delete no permitido. Configurá allowHardDelete: true para habilitarlo.");
  }

  const registro = await model.findByPk(id, {
    ...(transaction !== undefined && { transaction }),
  });

  if (!registro) return false;

  await registro.destroy({ ...(transaction !== undefined && { transaction }) });

  return true;
}

// =============================================================
// RAW QUERY — para consultas SQL que el ORM no puede expresar
// =============================================================

/**
 * Ejecuta SQL crudo usando sequelize.query().
 *
 * CUÁNDO USAR raw query:
 *   - JOINs muy complejos con múltiples niveles o condiciones dinámicas
 *   - GROUP BY + HAVING + funciones de agregado (SUM, COUNT, AVG)
 *   - CTEs (WITH ...), subconsultas, WINDOW FUNCTIONS
 *   - Consultas de reporte que mezclan muchas tablas
 *   - Cuando la consulta Sequelize ORM resulta ilegible o incorrecta
 *
 * CUÁNDO NO USAR raw query:
 *   - CRUD simple → usar las funciones de este archivo
 *   - Joins de 1-2 niveles → usar include de Sequelize
 *   - Siempre que el ORM pueda expresarlo claramente
 *
 * @param {object}   opts
 * @param {string}   opts.sql           - Query SQL con parámetros (:nombre) o (?)
 * @param {object|Array} [opts.replacements] - Valores para los parámetros
 * @param {string}   [opts.type]        - sequelize.QueryTypes.SELECT | INSERT | UPDATE | DELETE
 * @param {boolean}  [opts.raw=true]    - Retorna arrays planos (no instancias Sequelize)
 * @param {boolean}  [opts.nest=false]  - Anida columnas con alias tabla.columna
 * @param {object}   [opts.transaction] - Transacción Sequelize
 * @param {Function} [opts.logging]     - función de log SQL
 * @returns {Array} Resultados de la query
 *
 * @example
 * const resultado = await rawQueryGenerico({
 *   sql: `
 *     SELECT u.ID_AUTH02, u.AUTH02_NOMBRE, COUNT(l.ID_AUTH04) AS total_logins
 *     FROM "AUTH_02_USUARIO" u
 *     LEFT JOIN "AUTH_04_LOG_SESION" l ON l."RELA_AUTH02" = u."ID_AUTH02"
 *     WHERE u."AUTH02_FECHABAJA" IS NULL
 *     GROUP BY u."ID_AUTH02", u."AUTH02_NOMBRE"
 *     HAVING COUNT(l.ID_AUTH04) > :minLogins
 *     ORDER BY total_logins DESC
 *     LIMIT :limite
 *   `,
 *   replacements: { minLogins: 5, limite: 20 },
 *   type: QueryTypes.SELECT,
 * });
 */
export async function rawQueryGenerico({
  sql,
  replacements,
  type,
  raw         = true,
  nest        = false,
  transaction,
  logging,
} = {}) {
  if (!sql || typeof sql !== "string" || !sql.trim()) {
    throw new Error("sql es requerido en rawQueryGenerico");
  }

  const { QueryTypes } = await import("sequelize");

  return await sequelize.query(sql, {
    replacements,
    type:        type ?? QueryTypes.SELECT,
    raw,
    nest,
    ...(transaction !== undefined && { transaction }),
    ...(logging     !== undefined && { logging }),
  });
}

// =============================================================
// VALIDACIONES INTERNAS
// =============================================================

function validarModelo(model) {
  if (!model) throw new Error("model es requerido en el servicio genérico");
}

function validarId(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("id es requerido para esta operación");
  }
}
