// =============================================================
// controllers/clientes_controller.js
//
// Perfil extendido del cliente + direcciones guardadas.
// Toda operación está scoped al usuario autenticado (req.user.id).
// El perfil se crea automáticamente en el primer acceso.
// =============================================================

import { sequelize } from "../database/sequelize.js";

import {
  Cli01Perfil,
  Cli02Direccion,
  Ord02CondicionIva,
} from "../models/index.js";

import {
  okResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from "../utils/api_response.js";

// =============================================================
// Helpers
// =============================================================

async function obtenerOCrearPerfil(userId, transaction = null) {
  const [perfil] = await Cli01Perfil.findOrCreate({
    where:    { RELA_AUTH02: userId },
    defaults: { RELA_AUTH02: userId, CLI01_FECHAALTA: new Date() },
    transaction,
  });
  return perfil;
}

async function verificarDireccion(direccionId, perfilId) {
  return Cli02Direccion.findOne({
    where: { ID_CLI02: direccionId, RELA_CLI01: perfilId, CLI02_FECHABAJA: null },
  });
}

// =============================================================
// Mappers
// =============================================================

function mapDireccion(d) {
  return {
    id:           d.ID_CLI02,
    alias:        d.CLI02_ALIAS,
    calle:        d.CLI02_CALLE,
    numero:       d.CLI02_NUMERO,
    piso:         d.CLI02_PISO,
    depto:        d.CLI02_DEPTO,
    codigo_postal: d.CLI02_CODIGO_POSTAL,
    localidad:    d.CLI02_LOCALIDAD,
    provincia:    d.CLI02_PROVINCIA,
    es_default:   d.CLI02_ES_DEFAULT,
  };
}

function mapPerfil(p) {
  const dirs = (p.direcciones ?? [])
    .slice()
    .sort((a, b) => Number(b.CLI02_ES_DEFAULT) - Number(a.CLI02_ES_DEFAULT));

  return {
    id:           p.ID_CLI01,
    telefono:     p.CLI01_TELEFONO,
    dni:          p.CLI01_DNI,
    cuit:         p.CLI01_CUIT,
    razon_social: p.CLI01_RAZON_SOCIAL,
    condicion_iva: p.condicionIva
      ? { id: p.condicionIva.ID_ORD02, codigo: p.condicionIva.ORD02_CODIGO, nombre: p.condicionIva.ORD02_NOMBRE }
      : null,
    direcciones: dirs.map(mapDireccion),
  };
}

const PERFIL_INCLUDE = [
  {
    model: Ord02CondicionIva,
    as:    "condicionIva",
    attributes: ["ID_ORD02", "ORD02_CODIGO", "ORD02_NOMBRE"],
  },
  {
    model:    Cli02Direccion,
    as:       "direcciones",
    where:    { CLI02_FECHABAJA: null },
    required: false,
  },
];

// =============================================================
// GET /clientes/perfil
// Devuelve el perfil (lo crea si no existe) con condición IVA y
// lista de direcciones activas.
// =============================================================

export async function getPerfil(req, res) {
  try {
    await obtenerOCrearPerfil(req.user.id);

    const perfil = await Cli01Perfil.findOne({
      where:   { RELA_AUTH02: req.user.id },
      include: PERFIL_INCLUDE,
    });

    return okResponse(res, { data: mapPerfil(perfil) });
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al obtener perfil", error });
  }
}

// =============================================================
// PUT /clientes/perfil
// Actualiza los campos opcionales del perfil.
// Solo se actualizan los campos presentes en el body.
// =============================================================

export async function updatePerfil(req, res) {
  try {
    const { telefono, dni, cuit, razon_social, condicion_iva_id } = req.body;

    const perfil = await obtenerOCrearPerfil(req.user.id);

    const updates = {};
    if (telefono     !== undefined) updates.CLI01_TELEFONO    = telefono;
    if (dni          !== undefined) updates.CLI01_DNI         = dni;
    if (cuit         !== undefined) updates.CLI01_CUIT        = cuit;
    if (razon_social !== undefined) updates.CLI01_RAZON_SOCIAL = razon_social;

    if (condicion_iva_id !== undefined) {
      if (condicion_iva_id !== null) {
        const cond = await Ord02CondicionIva.findByPk(condicion_iva_id);
        if (!cond) return badRequestResponse(res, { mensaje: "Condición IVA no válida" });
      }
      updates.RELA_ORD02 = condicion_iva_id;
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse(res, { mensaje: "No se recibieron campos para actualizar" });
    }

    updates.CLI01_FECHAMOD = new Date();
    await perfil.update(updates);

    const actualizado = await Cli01Perfil.findOne({
      where:   { RELA_AUTH02: req.user.id },
      include: PERFIL_INCLUDE,
    });

    return okResponse(res, { data: mapPerfil(actualizado), mensaje: "Perfil actualizado" });
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al actualizar perfil", error });
  }
}

// =============================================================
// GET /clientes/direcciones
// =============================================================

export async function getDirecciones(req, res) {
  try {
    const perfil = await obtenerOCrearPerfil(req.user.id);

    const dirs = await Cli02Direccion.findAll({
      where: { RELA_CLI01: perfil.ID_CLI01, CLI02_FECHABAJA: null },
      order: [["CLI02_ES_DEFAULT", "DESC"], ["ID_CLI02", "ASC"]],
    });

    return okResponse(res, { data: dirs.map(mapDireccion) });
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al obtener direcciones", error });
  }
}

// =============================================================
// POST /clientes/direcciones
// Si es_default = true, desmarca las demás dentro de la misma TX.
// =============================================================

export async function crearDireccion(req, res) {
  try {
    const { alias, calle, numero, piso, depto, codigo_postal, localidad, provincia, es_default } = req.body;

    if (!calle || !numero || !codigo_postal || !localidad || !provincia) {
      return badRequestResponse(res, {
        mensaje: "calle, numero, codigo_postal, localidad y provincia son requeridos",
      });
    }

    const perfil = await obtenerOCrearPerfil(req.user.id);
    const t = await sequelize.transaction();

    try {
      if (es_default) {
        await Cli02Direccion.update(
          { CLI02_ES_DEFAULT: false },
          { where: { RELA_CLI01: perfil.ID_CLI01, CLI02_FECHABAJA: null }, transaction: t }
        );
      }

      const dir = await Cli02Direccion.create(
        {
          RELA_CLI01:          perfil.ID_CLI01,
          CLI02_ALIAS:         alias ?? "Casa",
          CLI02_CALLE:         calle,
          CLI02_NUMERO:        numero,
          CLI02_PISO:          piso   ?? null,
          CLI02_DEPTO:         depto  ?? null,
          CLI02_CODIGO_POSTAL: codigo_postal,
          CLI02_LOCALIDAD:     localidad,
          CLI02_PROVINCIA:     provincia,
          CLI02_ES_DEFAULT:    es_default ?? false,
          CLI02_FECHAALTA:     new Date(),
        },
        { transaction: t }
      );

      await t.commit();
      return createdResponse(res, { data: mapDireccion(dir), mensaje: "Dirección guardada" });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al crear dirección", error });
  }
}

// =============================================================
// PUT /clientes/direcciones/:id
// Solo actualiza campos de texto — es_default se gestiona aparte
// con PUT /direcciones/:id/default.
// =============================================================

export async function updateDireccion(req, res) {
  try {
    const perfil = await obtenerOCrearPerfil(req.user.id);
    const dir    = await verificarDireccion(req.params.id, perfil.ID_CLI01);
    if (!dir) return notFoundResponse(res, { mensaje: "Dirección no encontrada" });

    const { alias, calle, numero, piso, depto, codigo_postal, localidad, provincia } = req.body;
    const updates = {};
    if (alias         !== undefined) updates.CLI02_ALIAS         = alias;
    if (calle         !== undefined) updates.CLI02_CALLE         = calle;
    if (numero        !== undefined) updates.CLI02_NUMERO        = numero;
    if (piso          !== undefined) updates.CLI02_PISO          = piso;
    if (depto         !== undefined) updates.CLI02_DEPTO         = depto;
    if (codigo_postal !== undefined) updates.CLI02_CODIGO_POSTAL = codigo_postal;
    if (localidad     !== undefined) updates.CLI02_LOCALIDAD     = localidad;
    if (provincia     !== undefined) updates.CLI02_PROVINCIA     = provincia;

    if (Object.keys(updates).length === 0) {
      return badRequestResponse(res, { mensaje: "No se recibieron campos para actualizar" });
    }

    await dir.update(updates);
    return okResponse(res, { data: mapDireccion(dir), mensaje: "Dirección actualizada" });
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al actualizar dirección", error });
  }
}

// =============================================================
// DELETE /clientes/direcciones/:id  (soft delete)
// =============================================================

export async function deleteDireccion(req, res) {
  try {
    const perfil = await obtenerOCrearPerfil(req.user.id);
    const dir    = await verificarDireccion(req.params.id, perfil.ID_CLI01);
    if (!dir) return notFoundResponse(res, { mensaje: "Dirección no encontrada" });

    await dir.update({ CLI02_FECHABAJA: new Date() });
    return okResponse(res, { mensaje: "Dirección eliminada" });
  } catch (error) {
    return errorResponse(res, { mensaje: "Error al eliminar dirección", error });
  }
}

// =============================================================
// PUT /clientes/direcciones/:id/default
// Desmarca todas las del perfil y marca la seleccionada.
// =============================================================

export async function setDireccionDefault(req, res) {
  const t = await sequelize.transaction();
  try {
    const perfil = await obtenerOCrearPerfil(req.user.id);
    const dir    = await verificarDireccion(req.params.id, perfil.ID_CLI01);
    if (!dir) {
      await t.rollback();
      return notFoundResponse(res, { mensaje: "Dirección no encontrada" });
    }

    await Cli02Direccion.update(
      { CLI02_ES_DEFAULT: false },
      { where: { RELA_CLI01: perfil.ID_CLI01, CLI02_FECHABAJA: null }, transaction: t }
    );
    await dir.update({ CLI02_ES_DEFAULT: true }, { transaction: t });

    await t.commit();
    return okResponse(res, { data: mapDireccion(dir), mensaje: "Dirección predeterminada actualizada" });
  } catch (error) {
    await t.rollback();
    return errorResponse(res, { mensaje: "Error al actualizar dirección predeterminada", error });
  }
}
