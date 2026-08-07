import {
  buscarPersonaParaKinesiologia,
  listarPersonasRegistradas,
  agregarPacienteKinesiologia,
  listarPacientesKinesiologia,
  obtenerDetallePaciente,
  registrarSesion,
  agregarRecordatorioASesion,
  eliminarSesion,
  eliminarRecordatorio,
  cambiarEstadoPacienteKinesiologia,
} from "../../services/kinesiologia/kinesiologia_service.js";
import {
  listarPatologias,
  crearPatologia,
  actualizarPatologia,
  cambiarEstadoPatologia,
} from "../../services/kinesiologia/patologia_service.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

export async function buscarPersona(req, res, next) {
  try {
    const dni = String(req.query.dni ?? "").trim();
    if (!dni) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "dni es obligatorio" });
    }
    const r = await buscarPersonaParaKinesiologia({ dni });
    if (!r.ok && r.codigo === "NO_ENCONTRADA") return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function listaPersonasRegistradas(req, res, next) {
  try {
    const { q, dni, page, limit, sort, order } = req.query;
    const r = await listarPersonasRegistradas({
      q: q ? String(q).trim() : null,
      dni: dni ? String(dni).trim() : null,
      page: Math.max(1, toInt(page, 1)),
      limit: Math.min(100, Math.max(1, toInt(limit, 20))),
      sort: sort ? String(sort) : "apellido",
      order: order && String(order).toLowerCase() === "asc" ? "asc" : "desc",
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function agregarPaciente(req, res, next) {
  try {
    const { persona_id, patologia_ids, fecha_diagnostico, objetivo, fecha_inicio } = req.body;
    const r = await agregarPacienteKinesiologia({
      persona_id: toInt(persona_id, null),
      patologia_ids: Array.isArray(patologia_ids) ? patologia_ids.map((id) => toInt(id, null)).filter(Boolean) : [],
      fecha_diagnostico,
      objetivo,
      fecha_inicio,
      creado_por_id: req.user.usuario_id,
    });
    if (!r.ok) return res.status(400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function listaPacientes(req, res, next) {
  try {
    const { q, dni, estado, page, limit, sort, order } = req.query;
    const r = await listarPacientesKinesiologia({
      q: q ? String(q).trim() : null,
      dni: dni ? String(dni).trim() : null,
      estado: estado ? String(estado) : null,
      page: Math.max(1, toInt(page, 1)),
      limit: Math.min(100, Math.max(1, toInt(limit, 20))),
      sort: sort ? String(sort) : "apellido",
      order: order && String(order).toLowerCase() === "asc" ? "asc" : "desc",
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstadoPaciente(req, res, next) {
  try {
    const id = toInt(req.params.id, null);
    const { estado } = req.body ?? {};
    if (!id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }
    const r = await cambiarEstadoPacienteKinesiologia(id, estado);
    if (!r.ok) return res.status(r.codigo === "NO_EXISTE" ? 404 : 400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function detallePaciente(req, res, next) {
  try {
    const paciente_kinesiologia_id = toInt(req.params.id, null);
    if (!paciente_kinesiologia_id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }
    const r = await obtenerDetallePaciente({ paciente_kinesiologia_id });
    if (!r.ok && r.codigo === "NO_EXISTE") return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

function parseRecordatorio(item) {
  const { dias, observacion } = item ?? {};
  return {
    dias: Array.isArray(dias) ? dias.map(String) : [],
    observacion: observacion ?? "",
  };
}

export async function crearSesion(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const { fecha, recordatorios } = req.body ?? {};
    const r = await registrarSesion({
      ficha_id,
      fecha: fecha || undefined,
      recordatorios: Array.isArray(recordatorios) ? recordatorios.map(parseRecordatorio) : [],
      registrado_por_id: req.user.usuario_id,
    });
    if (!r.ok) return res.status(r.codigo === "NO_EXISTE" ? 404 : 400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function eliminarSesionController(req, res, next) {
  try {
    const id = toInt(req.params.id, null);
    if (!id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }
    const r = await eliminarSesion(id);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function crearRecordatorio(req, res, next) {
  try {
    const sesion_id = toInt(req.params.id, null);
    const { dias, observacion } = parseRecordatorio(req.body);
    const r = await agregarRecordatorioASesion({ sesion_id, dias, observacion });
    if (!r.ok) return res.status(r.codigo === "NO_EXISTE" ? 404 : 400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function eliminarRecordatorioController(req, res, next) {
  try {
    const id = toInt(req.params.id, null);
    if (!id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }
    const r = await eliminarRecordatorio(id);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function listaPatologias(req, res, next) {
  try {
    const r = await listarPatologias();
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function crearPatologiaController(req, res, next) {
  try {
    const r = await crearPatologia({ descripcion: req.body?.descripcion });
    if (!r.ok) return res.status(400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function actualizarPatologiaController(req, res, next) {
  try {
    const id = toInt(req.params.id, null);
    const r = await actualizarPatologia(id, { descripcion: req.body?.descripcion });
    if (!r.ok) return res.status(r.codigo === "NO_EXISTE" ? 404 : 400).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstadoPatologiaController(req, res, next) {
  try {
    const id = toInt(req.params.id, null);
    const { activo } = req.body ?? {};
    if (typeof activo !== "boolean") {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "activo debe ser booleano" });
    }
    const r = await cambiarEstadoPatologia(id, activo);
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

