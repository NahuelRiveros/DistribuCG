// =============================================================
// controllers/generic_controller.js
// Factories que generan controllers Express a partir de una
// configuración de catálogo/entidad.
//
// Uso:
//   catalogosRouter.get("/estados-civiles", crearListController(ESTADOS_CIVILES_CONFIG));
//   catalogosRouter.get("/estados-civiles/:id", crearGetByIdController(ESTADOS_CIVILES_CONFIG));
//   catalogosRouter.post("/estados-civiles", crearCreateController(ESTADOS_CIVILES_CONFIG));
//   catalogosRouter.put("/estados-civiles/:id", crearUpdateController(ESTADOS_CIVILES_CONFIG));
//   catalogosRouter.delete("/estados-civiles/:id", crearSoftDeleteController(ESTADOS_CIVILES_CONFIG));
// =============================================================

import { Op, UniqueConstraintError, ValidationError } from "sequelize";

import {
  listarGenerico,
  paginadoGenerico,
  buscarPorIdGenerico,
  crearGenerico,
  actualizarGenerico,
  bajaLogicaGenerico,
  reactivarGenerico,
  eliminarFisicoGenerico,
} from "../services/generic_service.js";

import {
  okResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from "../utils/api_response.js";

import {
  sanitizarPaginacion,
  construirPaginacion,
} from "../utils/pagination.js";

// =============================================================
// ESTRUCTURA DE CONFIG ESPERADA
// =============================================================
//
// const CONFIG = {
//   model:           UsePers03EstadoCivil,     // Modelo Sequelize (requerido)
//   nombre:          "estados civiles",        // Nombre legible para mensajes
//   where:           { FECHABAJA: null },      // Filtro base (activos)
//   attributes:      ["ID", "NOMBRE"],         // Columnas a devolver
//   order:           [["NOMBRE", "ASC"]],      // Orden por defecto
//   include:         [],                       // Joins Sequelize (opcional)
//   campoBusqueda:   "NOMBRE_COLUMNA",         // Búsqueda ?q= (string o array)
//   searchableFields:["NOMBRE", "APELLIDO"],   // Alternativa array a campoBusqueda
//   campoFechaBaja:  "USEPERS03_FECHABAJA",    // Para baja lógica
//   allowHardDelete: false,                    // true para delete físico
//
//   // Filtros dinámicos desde query params:
//   // GET /ruta?sexo_id=1&estado_civil_id=2
//   allowedFilters: {
//     sexo_id:         "RELA_USEPERS02",
//     estado_civil_id: "RELA_USEPERS03",
//   },
//
//   // Whitelist de campos permitidos al crear/actualizar:
//   createFields: ["CAMPO_A", "CAMPO_B"],
//   updateFields: ["CAMPO_A", "CAMPO_B"],
// };
//
// =============================================================

// -------------------------------------------------------------
// Helpers internos
// -------------------------------------------------------------

/**
 * Construye el objeto where final combinando:
 *  - config.where (filtro base, ej: activos)
 *  - allowedFilters mapeados desde req.query
 */
function buildWhere(config, query) {
  const where = { ...(config.where ?? {}) };

  if (config.allowedFilters) {
    for (const [queryParam, columna] of Object.entries(config.allowedFilters)) {
      const valor = query[queryParam];
      if (valor !== undefined && valor !== "") {
        where[columna] = valor;
      }
    }
  }

  return where;
}

/**
 * Agrega condición OR de búsqueda por texto a un where existente.
 * Soporta campoBusqueda (string|array) y searchableFields (array).
 */
function addTextSearch(where, config, texto) {
  const campos = config.searchableFields
    ?? (config.campoBusqueda
      ? (Array.isArray(config.campoBusqueda) ? config.campoBusqueda : [config.campoBusqueda])
      : null);

  if (!campos || !texto) return where;

  const textoBusqueda = String(texto).trim();
  if (!textoBusqueda) return where;

  const condicionOr = { [Op.or]: campos.map(campo => ({ [campo]: { [Op.iLike]: `%${textoBusqueda}%` } })) };

  // Preservar condiciones AND previas
  if (where[Op.and]) {
    return { ...where, [Op.and]: [...where[Op.and], condicionOr] };
  }
  return { ...where, [Op.and]: [condicionOr] };
}

/**
 * Filtra un objeto de datos a solo los campos declarados en una whitelist.
 * Devuelve null si la whitelist está definida pero ningún campo es válido.
 */
function filtrarCampos(datos, campos) {
  if (!campos || !Array.isArray(campos)) return datos;
  const filtrado = Object.fromEntries(
    Object.entries(datos).filter(([k]) => campos.includes(k))
  );
  return Object.keys(filtrado).length > 0 ? filtrado : null;
}

// -------------------------------------------------------------
// GET /ruta — Listar todos (sin paginación)
// -------------------------------------------------------------

/**
 * Devuelve todos los registros activos.
 * Soporta allowedFilters desde query params.
 */
export function crearListController(config) {
  return async function (req, res) {
    try {
      const where = buildWhere(config, req.query);

      const data = await listarGenerico({
        model:      config.model,
        where,
        attributes: config.attributes,
        include:    config.include,
        order:      config.order,
      });

      return okResponse(res, {
        data,
        mensaje: `Listado de ${config.nombre} obtenido correctamente`,
      });
    } catch (error) {
      return errorResponse(res, {
        mensaje: `No se pudo obtener el listado de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// GET /ruta?page=1&limit=10 — Listar paginado
// -------------------------------------------------------------

/**
 * Devuelve registros paginados con soporte para:
 *  - ?page=1&limit=10      → paginación
 *  - ?q=texto              → búsqueda en searchableFields / campoBusqueda
 *  - ?sexo_id=1            → filtros dinámicos declarados en allowedFilters
 */
export function crearListPaginadoController(config) {
  return async function (req, res) {
    try {
      const { page, limit, offset } = sanitizarPaginacion(req.query.page, req.query.limit);

      let where = buildWhere(config, req.query);

      if (req.query.q) {
        where = addTextSearch(where, config, req.query.q);
      }

      const { rows, count } = await paginadoGenerico({
        model:      config.model,
        where,
        attributes: config.attributes,
        include:    config.include,
        order:      config.order,
        limit,
        offset,
      });

      const pagination = construirPaginacion({ total: count, page, limit });

      return okResponse(res, {
        data: rows,
        mensaje: `Listado paginado de ${config.nombre} obtenido correctamente`,
        pagination,
      });
    } catch (error) {
      return errorResponse(res, {
        mensaje: `No se pudo obtener el listado de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// GET /ruta/:id — Obtener por ID
// -------------------------------------------------------------

/**
 * Busca un registro por su clave primaria (req.params.id).
 * Devuelve 404 si no existe.
 */
export function crearGetByIdController(config) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return badRequestResponse(res, { mensaje: "El parámetro id es requerido" });
      }

      const data = await buscarPorIdGenerico({
        model:      config.model,
        id,
        attributes: config.attributes,
        include:    config.include,
      });

      if (!data) {
        return notFoundResponse(res, {
          mensaje: `No se encontró el registro de ${config.nombre} con id ${id}`,
        });
      }

      return okResponse(res, {
        data,
        mensaje: `Registro de ${config.nombre} obtenido correctamente`,
      });
    } catch (error) {
      return errorResponse(res, {
        mensaje: `No se pudo obtener el registro de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// POST /ruta — Crear registro
// -------------------------------------------------------------

/**
 * Crea un nuevo registro.
 * Si config.createFields está definido, solo acepta esos campos del body.
 */
export function crearCreateController(config) {
  return async function (req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return badRequestResponse(res, { mensaje: "El body no puede estar vacío" });
      }

      const datos = filtrarCampos(req.body, config.createFields);

      if (!datos) {
        return badRequestResponse(res, { mensaje: "Ningún campo enviado es permitido para crear" });
      }

      const data = await crearGenerico({ model: config.model, datos });

      return createdResponse(res, {
        data,
        mensaje: `${config.nombre} creado correctamente`,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const campo = error.errors?.[0]?.path ?? "campo";
        return badRequestResponse(res, {
          mensaje: `Ya existe un registro de ${config.nombre} con ese valor en "${campo}"`,
        });
      }
      if (error instanceof ValidationError) {
        return badRequestResponse(res, {
          mensaje: error.errors?.[0]?.message ?? `Datos inválidos para ${config.nombre}`,
        });
      }
      return errorResponse(res, {
        mensaje: `No se pudo crear el registro de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// PUT /ruta/:id — Actualizar registro
// -------------------------------------------------------------

/**
 * Actualiza un registro por su PK.
 * Si config.updateFields está definido, solo acepta esos campos del body.
 */
export function crearUpdateController(config) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return badRequestResponse(res, { mensaje: "El parámetro id es requerido" });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return badRequestResponse(res, { mensaje: "El body no puede estar vacío" });
      }

      const datos = filtrarCampos(req.body, config.updateFields);

      if (!datos) {
        return badRequestResponse(res, { mensaje: "Ningún campo enviado es permitido para actualizar" });
      }

      const data = await actualizarGenerico({ model: config.model, id, datos });

      if (!data) {
        return notFoundResponse(res, {
          mensaje: `No se encontró el registro de ${config.nombre} con id ${id}`,
        });
      }

      return okResponse(res, {
        data,
        mensaje: `${config.nombre} actualizado correctamente`,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const campo = error.errors?.[0]?.path ?? "campo";
        return badRequestResponse(res, {
          mensaje: `Ya existe un registro de ${config.nombre} con ese valor en "${campo}"`,
        });
      }
      if (error instanceof ValidationError) {
        return badRequestResponse(res, {
          mensaje: error.errors?.[0]?.message ?? `Datos inválidos para ${config.nombre}`,
        });
      }
      return errorResponse(res, {
        mensaje: `No se pudo actualizar el registro de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// DELETE /ruta/:id — Baja lógica (soft delete)
// -------------------------------------------------------------

/**
 * Realiza baja lógica: setea campoFechaBaja = NOW().
 * Requiere que config.campoFechaBaja esté definido.
 */
export function crearSoftDeleteController(config) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return badRequestResponse(res, { mensaje: "El parámetro id es requerido" });
      }

      if (!config.campoFechaBaja) {
        return errorResponse(res, {
          mensaje: `La configuración de ${config.nombre} no tiene definido campoFechaBaja`,
          status: 500,
        });
      }

      const data = await bajaLogicaGenerico({
        model:          config.model,
        id,
        campoFechaBaja: config.campoFechaBaja,
      });

      if (!data) {
        return notFoundResponse(res, {
          mensaje: `No se encontró el registro de ${config.nombre} con id ${id}`,
        });
      }

      return okResponse(res, {
        data,
        mensaje: `${config.nombre} dado de baja correctamente`,
      });
    } catch (error) {
      return errorResponse(res, {
        mensaje: `No se pudo dar de baja el registro de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// PUT /ruta/:id/reactivar — Reactivar (deshacer baja lógica)
// -------------------------------------------------------------

/**
 * Reactiva un registro poniendo campoFechaBaja = null.
 */
export function crearReactivarController(config) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return badRequestResponse(res, { mensaje: "El parámetro id es requerido" });
      }

      if (!config.campoFechaBaja) {
        return errorResponse(res, {
          mensaje: `La configuración de ${config.nombre} no tiene definido campoFechaBaja`,
          status: 500,
        });
      }

      const data = await reactivarGenerico({
        model:          config.model,
        id,
        campoFechaBaja: config.campoFechaBaja,
      });

      if (!data) {
        return notFoundResponse(res, {
          mensaje: `No se encontró el registro de ${config.nombre} con id ${id}`,
        });
      }

      return okResponse(res, {
        data,
        mensaje: `${config.nombre} reactivado correctamente`,
      });
    } catch (error) {
      return errorResponse(res, {
        mensaje: `No se pudo reactivar el registro de ${config.nombre}`,
        error,
      });
    }
  };
}

// -------------------------------------------------------------
// DELETE /ruta/:id/fisico — Eliminación física (hard delete)
// -------------------------------------------------------------

/**
 * Elimina físicamente un registro.
 * ⚠️  Solo funciona si config.allowHardDelete === true
 */
export function crearHardDeleteController(config) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return badRequestResponse(res, { mensaje: "El parámetro id es requerido" });
      }

      const eliminado = await eliminarFisicoGenerico({
        model:           config.model,
        id,
        allowHardDelete: config.allowHardDelete ?? false,
      });

      if (!eliminado) {
        return notFoundResponse(res, {
          mensaje: `No se encontró el registro de ${config.nombre} con id ${id}`,
        });
      }

      return okResponse(res, {
        data: null,
        mensaje: `${config.nombre} eliminado físicamente`,
      });
    } catch (error) {
      // Si el error es el de "no permitido", respondemos 403
      if (error.message?.includes("Hard delete no permitido")) {
        return errorResponse(res, { mensaje: error.message, status: 403 });
      }
      return errorResponse(res, {
        mensaje: `No se pudo eliminar el registro de ${config.nombre}`,
        error,
      });
    }
  };
}