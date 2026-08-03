import {
  buscarPersonaParaKinesiologia,
  agregarPacienteKinesiologia,
  listarPacientesKinesiologia,
  obtenerDetallePaciente,
  registrarTestFuncional,
  registrarTestFuerza,
  registrarSesionKinesiologia,
} from "../services/kinesiologia_service.js";

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

export async function agregarPaciente(req, res, next) {
  try {
    const { persona_id, patologia_id, fecha_diagnostico, objetivo, fecha_inicio } = req.body;
    const r = await agregarPacienteKinesiologia({
      persona_id: toInt(persona_id, null),
      patologia_id: toInt(patologia_id, null),
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

export async function crearSesion(req, res, next) {
  try {
    const ficha_id = toInt(req.params.id, null);
    const {
      ejercicio_id, peso, series, repeticiones, rir,
      dolor_durante, dolor_24h,
      calidad_movimiento, tolerancia_carga, confianza_paciente, cumplimiento_programa,
      tecnica_correcta, sin_compensaciones, buena_recuperacion, apto_para_subir_carga,
      observaciones, fecha,
    } = req.body;

    const r = await registrarSesionKinesiologia({
      ficha_id,
      ejercicio_id: ejercicio_id != null ? toInt(ejercicio_id, null) : null,
      peso: peso ?? null,
      series: series != null ? toInt(series, null) : null,
      repeticiones: repeticiones != null ? toInt(repeticiones, null) : null,
      rir: rir != null ? toInt(rir, null) : null,
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
      registrado_por_id: req.user.usuario_id,
    });
    return res.json(r);
  } catch (err) {
    next(err);
  }
}
