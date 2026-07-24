// src/controllers/lista_alumnos_controller.js
import { listarAlumnos } from "../services/lista_alumnos_service.js";
import { obtenerDetalleAlumno } from "../services/alumno_detalle_service.js";
import { obtenerAlumnosCumples } from "../services/alumno_cumples.js";

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

export async function listaAlumnos(req, res, next) {
  try {
    const { q, dni, estado_id, plan_vigente, page, limit, sort, order } = req.query;

    const filtros = {
      q: q ? String(q).trim() : null,
      dni: dni ? String(dni).trim() : null,
      estado_id: estado_id != null && estado_id !== "" ? toInt(estado_id, null) : null,
      plan_vigente: toBoolOrNull(plan_vigente),
      page: Math.max(1, toInt(page, 1)),
      limit: Math.min(100, Math.max(1, toInt(limit, 20))),
      sort: sort ? String(sort) : "apellido",
      order: order && String(order).toLowerCase() === "asc" ? "asc" : "desc",
    };

    const r = await listarAlumnos(filtros);
    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function detalleAlumno(req, res, next) {
  try {
    const alumno_id = Number(req.params.id);
    if (!alumno_id) {
      return res.status(400).json({ ok: false, codigo: "VALIDACION", mensaje: "id inválido" });
    }

    const r = await obtenerDetalleAlumno({ alumno_id });

    if (!r.ok && r.codigo === "NO_EXISTE") {
      return res.status(404).json(r);
    }

    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function alumnosCumples(req, res, next) {
  try {
    const dias = Number(req.query.dias ?? 30);
    const incluirMes = String(req.query.incluirMes ?? "false") === "true";

    const data = await obtenerAlumnosCumples({ dias, incluirMes });

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}