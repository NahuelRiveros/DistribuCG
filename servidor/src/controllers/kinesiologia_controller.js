import {
  buscarPersonaParaKinesiologia,
  listarPersonasRegistradas,
  agregarPacienteKinesiologia,
  listarPacientesKinesiologia,
  obtenerDetallePaciente,
  registrarTestFuncional,
  registrarTestFuerza,
  registrarSesionKinesiologia,
  actualizarSesionKinesiologia,
  guardarRutinaFicha,
} from "../services/kinesiologia_service.js";
import {
  listarPatologias,
  crearPatologia,
  actualizarPatologia,
  cambiarEstadoPatologia,
} from "../services/patologia_service.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function toBoolOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "si", "sí", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  return null;
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
    const { q, dni, activo, page, limit, sort, order } = req.query;
    const r = await listarPacientesKinesiologia({
      q: q ? String(q).trim() : null,
      dni: dni ? String(dni).trim() : null,
      activo: toBoolOrNull(activo),
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

export async function crearTestFuncional(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const { ejercicio_id, calidad_movimiento, observaciones, fecha } = req.body;
    const r = await registrarTestFuncional({
      ficha_id,
      ejercicio_id: toInt(ejercicio_id, null),
      calidad_movimiento: toInt(calidad_movimiento, null),
      observaciones: observaciones ?? null,
      fecha: fecha || undefined,
      registrado_por_id: req.user.usuario_id,
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function crearTestFuerza(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const { ejercicio_id, repeticiones, peso, fecha } = req.body;
    const r = await registrarTestFuerza({
      ficha_id,
      ejercicio_id: toInt(ejercicio_id, null),
      repeticiones: toInt(repeticiones, null),
      peso,
      fecha: fecha || undefined,
      registrado_por_id: req.user.usuario_id,
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

function parseEjercicioSesion(item) {
  const { ejercicio_id, peso, series, repeticiones, rir } = item ?? {};
  return {
    ejercicio_id: ejercicio_id != null ? toInt(ejercicio_id, null) : null,
    peso: peso ?? null,
    series: series != null ? toInt(series, null) : null,
    repeticiones: repeticiones != null ? toInt(repeticiones, null) : null,
    rir: rir != null ? toInt(rir, null) : null,
  };
}

function parseSesionBody(body) {
  const {
    dolor_durante, dolor_24h,
    calidad_movimiento, tolerancia_carga, confianza_paciente, cumplimiento_programa,
    tecnica_correcta, sin_compensaciones, buena_recuperacion, apto_para_subir_carga,
    observaciones, fecha, ejercicios,
  } = body;

  return {
    dolor_durante: toInt(dolor_durante, null),
    dolor_24h: dolor_24h != null ? toInt(dolor_24h, null) : null,
    calidad_movimiento: toInt(calidad_movimiento, null),
    tolerancia_carga: toInt(tolerancia_carga, null),
    confianza_paciente: toInt(confianza_paciente, null),
    cumplimiento_programa: toInt(cumplimiento_programa, null),
    tecnica_correcta: !!tecnica_correcta,
    sin_compensaciones: !!sin_compensaciones,
    buena_recuperacion: !!buena_recuperacion,
    apto_para_subir_carga: !!apto_para_subir_carga,
    observaciones: observaciones ?? null,
    fecha: fecha || undefined,
    ejercicios: Array.isArray(ejercicios) ? ejercicios.map(parseEjercicioSesion) : [],
  };
}

export async function crearSesion(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const r = await registrarSesionKinesiologia({
      ficha_id,
      ...parseSesionBody(req.body),
      registrado_por_id: req.user.usuario_id,
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function actualizarSesion(req, res, next) {
  try {
    const sesion_id = toInt(req.params.id, null);
    if (!sesion_id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }
    const r = await actualizarSesionKinesiologia(sesion_id, parseSesionBody(req.body));
    if (!r.ok && r.codigo === "NO_EXISTE") return res.status(404).json(r);
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

export async function guardarRutina(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const r = await guardarRutinaFicha(ficha_id, items.map((it) => ({
      ejercicio_id: toInt(it?.ejercicio_id, null),
    })));
    if (!r.ok) return res.status(404).json(r);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}
