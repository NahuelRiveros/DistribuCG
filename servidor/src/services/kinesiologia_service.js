import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";
import {
  Persona, Alumno, PacienteKinesiologia, PacientePatologia,
  FichaKinesiologica, TestFuncional, TestFuerza,
  SesionKinesiologica, SesionKinesiologicaEjercicio,
} from "../models/index.js";
import { normalizarDocumento } from "./persona_service.js";

/**
 * Busca una persona ya registrada por DNI para el flujo "agregar paciente de
 * kinesiología" — indica si ya es alumno y/o ya es paciente de kinesiología,
 * para que el frontend decida si ofrece "agregar patología" o "ya está".
 */
export async function buscarPersonaParaKinesiologia({ dni }) {
  const documento = normalizarDocumento(dni);

  const persona = await Persona.findOne({ where: { documento } });
  if (!persona) {
    return { ok: false, codigo: "NO_ENCONTRADA", mensaje: "No existe una persona registrada con ese DNI" };
  }

  const [alumno, pacienteKinesiologia] = await Promise.all([
    Alumno.findOne({ where: { persona_id: persona.id } }),
    PacienteKinesiologia.findOne({ where: { persona_id: persona.id } }),
  ]);

  return {
    ok: true,
    persona: {
      persona_id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      documento: persona.documento,
    },
    es_alumno: !!alumno,
    ya_es_paciente_kinesiologia: !!pacienteKinesiologia,
    paciente_kinesiologia_id: pacienteKinesiologia?.id ?? null,
  };
}

/**
 * Listado paginado de TODAS las personas registradas (sean alumnos o no),
 * con flags de si ya es alumno y/o ya es paciente de kinesiología — para
 * elegir a quién agregar al grupo de kinesiología sin necesitar su DNI de
 * memoria. Mismo patrón que listarAlumnos/listarPacientesKinesiologia.
 */
export async function listarPersonasRegistradas({ q, dni, page = 1, limit = 20, sort = "apellido", order = "asc" }) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const where = [
    `p.eliminado_en IS NULL`,
    `NOT EXISTS (
      SELECT 1 FROM usuario u
      JOIN usuario_rol ur ON ur.usuario_id = u.id
      JOIN rol r          ON r.id = ur.rol_id
      WHERE u.persona_id = p.id AND r.codigo IN ('admin', 'super_admin', 'staff', 'kinesiologo')
    )`,
  ];
  const repl = { limit: l, offset };

  if (dni) {
    where.push(`p.documento::text ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }
  if (q) {
    where.push(`
      (
        p.documento::text ILIKE :q OR
        COALESCE(p.nombre,'') ILIKE :q OR
        COALESCE(p.apellido,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }

  const whereSQL = `WHERE ${where.join(" AND ")}`;

  const sortMap = { apellido: `p.apellido`, nombre: `p.nombre`, dni: `p.documento` };
  const sortSQL  = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sqlItems = `
    SELECT
      p.id AS persona_id,
      p.nombre, p.apellido, p.documento, p.celular,
      (a.id IS NOT NULL)  AS es_alumno,
      (pk.id IS NOT NULL) AS ya_es_paciente_kinesiologia,
      pk.id AS paciente_kinesiologia_id,
      pk.activo AS paciente_activo
    FROM persona p
    LEFT JOIN alumno a               ON a.persona_id  = p.id
    LEFT JOIN paciente_kinesiologia pk ON pk.persona_id = p.id
    ${whereSQL}
    ORDER BY ${sortSQL} ${orderSQL}
    LIMIT :limit OFFSET :offset
  `;

  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM persona p
    ${whereSQL}
  `;

  const items      = await sequelize.query(sqlItems, { replacements: repl, type: QueryTypes.SELECT });
  const [countRow] = await sequelize.query(sqlCount, { replacements: repl, type: QueryTypes.SELECT });

  const total      = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / l);

  return { ok: true, items, pagination: { page: p, limit: l, total, totalPages } };
}

/**
 * Agrega una persona ya registrada al grupo de kinesiología: crea (si hace
 * falta) paciente_kinesiologia, crea la patología del episodio y su ficha
 * con objetivo. Todo en una transacción, igual que registrarPersonaConAlumno.
 */
export async function agregarPacienteKinesiologia({
  persona_id, patologia_id, fecha_diagnostico, objetivo, fecha_inicio, creado_por_id,
}) {
  if (!persona_id || !patologia_id || !objetivo) {
    return { ok: false, codigo: "VALIDACION", mensaje: "persona_id, patologia_id y objetivo son obligatorios" };
  }

  return sequelize.transaction(async (t) => {
    const persona = await Persona.findByPk(persona_id, { transaction: t });
    if (!persona) {
      return { ok: false, codigo: "PERSONA_NO_EXISTE", mensaje: "La persona no existe" };
    }

    const [pacienteKinesiologia] = await PacienteKinesiologia.findOrCreate({
      where: { persona_id },
      defaults: { persona_id, fecha_inicio_tratamiento: fecha_inicio ?? new Date() },
      transaction: t,
    });

    const pacientePatologia = await PacientePatologia.create({
      paciente_kinesiologia_id: pacienteKinesiologia.id,
      patologia_id,
      fecha_diagnostico: fecha_diagnostico ?? null,
      activo: true,
    }, { transaction: t });

    const ficha = await FichaKinesiologica.create({
      paciente_patologia_id: pacientePatologia.id,
      objetivo,
      fecha_inicio: fecha_inicio ?? new Date(),
      creado_por_id,
    }, { transaction: t });

    return {
      ok: true,
      mensaje: "Paciente agregado a kinesiología correctamente",
      paciente_kinesiologia_id: pacienteKinesiologia.id,
      paciente_patologia_id: pacientePatologia.id,
      ficha_id: ficha.id,
    };
  });
}

/** Listado paginado de pacientes de kinesiología — mismo patrón que listarAlumnos. */
export async function listarPacientesKinesiologia({
  q, dni, activo, page = 1, limit = 20, sort = "apellido", order = "asc",
}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const where = [];
  const repl = { limit: l, offset };

  if (dni) {
    where.push(`p.documento::text ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }
  if (q) {
    where.push(`
      (
        p.documento::text ILIKE :q OR
        COALESCE(p.nombre,'') ILIKE :q OR
        COALESCE(p.apellido,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }
  if (activo === true)  where.push(`pk.activo = true`);
  if (activo === false) where.push(`pk.activo = false`);

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortMap = {
    apellido: `p.apellido`,
    nombre:   `p.nombre`,
    dni:      `p.documento`,
  };
  const sortSQL  = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sqlItems = `
    SELECT
      pk.id AS paciente_kinesiologia_id,
      pk.activo AS paciente_activo,
      pk.fecha_inicio_tratamiento,

      p.id AS persona_id,
      p.nombre, p.apellido, p.documento, p.celular,

      fpat.patologia_id,
      pat.descripcion AS patologia_desc,
      fpat.paciente_patologia_id,
      fpat.ficha_id,
      fpat.ficha_estado

    FROM paciente_kinesiologia pk
    JOIN persona p ON p.id = pk.persona_id

    LEFT JOIN LATERAL (
      SELECT
        pp.id AS paciente_patologia_id,
        pp.patologia_id,
        fk.id AS ficha_id,
        fk.estado AS ficha_estado
      FROM paciente_patologia pp
      LEFT JOIN ficha_kinesiologica fk ON fk.paciente_patologia_id = pp.id
      WHERE pp.paciente_kinesiologia_id = pk.id AND pp.activo = true
      ORDER BY pp.id DESC
      LIMIT 1
    ) fpat ON TRUE
    LEFT JOIN patologia pat ON pat.id = fpat.patologia_id

    ${whereSQL}
    ORDER BY ${sortSQL} ${orderSQL}
    LIMIT :limit OFFSET :offset
  `;

  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM paciente_kinesiologia pk
    JOIN persona p ON p.id = pk.persona_id
    ${whereSQL}
  `;

  const items    = await sequelize.query(sqlItems, { replacements: repl, type: QueryTypes.SELECT });
  const [countRow] = await sequelize.query(sqlCount, { replacements: repl, type: QueryTypes.SELECT });

  const total      = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / l);

  return {
    ok: true,
    items,
    pagination: { page: p, limit: l, total, totalPages },
  };
}

/** Detalle completo de un paciente: patologías, cada una con su ficha, evaluación inicial e historial de sesiones. */
export async function obtenerDetallePaciente({ paciente_kinesiologia_id }) {
  const pacienteKinesiologia = await PacienteKinesiologia.findByPk(paciente_kinesiologia_id, {
    include: [{ association: "persona" }],
  });
  if (!pacienteKinesiologia) {
    return { ok: false, codigo: "NO_EXISTE", mensaje: "El paciente no existe" };
  }

  const patologias = await PacientePatologia.findAll({
    where: { paciente_kinesiologia_id },
    include: [
      { association: "patologia" },
      {
        model: FichaKinesiologica,
        as: "ficha",
        include: [
          { model: TestFuncional, as: "tests_funcionales", include: [{ association: "ejercicio" }] },
          { model: TestFuerza, as: "tests_fuerza", include: [{ association: "ejercicio" }] },
          {
            model: SesionKinesiologica,
            as: "sesiones",
            include: [{
              association: "ejercicios",
              separate: true,
              order: [["orden", "ASC"]],
              include: [{ association: "ejercicio" }],
            }],
          },
        ],
      },
    ],
    order: [["id", "DESC"]],
  });

  return {
    ok: true,
    persona: pacienteKinesiologia.persona,
    paciente_kinesiologia_id: pacienteKinesiologia.id,
    activo: pacienteKinesiologia.activo,
    patologias,
  };
}

export async function registrarTestFuncional({ ficha_id, ejercicio_id, calidad_movimiento, observaciones, fecha, registrado_por_id }) {
  const registro = await TestFuncional.create({ ficha_id, ejercicio_id, calidad_movimiento, observaciones, fecha, registrado_por_id });
  return { ok: true, test_funcional: registro };
}

export async function registrarTestFuerza({ ficha_id, ejercicio_id, repeticiones, peso, fecha, registrado_por_id }) {
  const registro = await TestFuerza.create({ ficha_id, ejercicio_id, repeticiones, peso, fecha, registrado_por_id });
  return { ok: true, test_fuerza: registro };
}

const INCLUDE_EJERCICIOS_SESION = [{
  association: "ejercicios",
  separate: true,
  order: [["orden", "ASC"]],
  include: [{ association: "ejercicio" }],
}];

/** Crea una sesión (checklist) con N ejercicios asociados (puede ser ninguno). */
export async function registrarSesionKinesiologia({ ejercicios, ...checklist }) {
  const sesion = await sequelize.transaction(async (t) => {
    const nueva = await SesionKinesiologica.create(checklist, { transaction: t });

    if (ejercicios?.length) {
      await SesionKinesiologicaEjercicio.bulkCreate(
        ejercicios.map((ej, i) => ({ ...ej, sesion_id: nueva.id, orden: i })),
        { transaction: t }
      );
    }

    return nueva;
  });

  await sesion.reload({ include: INCLUDE_EJERCICIOS_SESION });
  return { ok: true, sesion };
}

/**
 * Edita una sesión ya guardada — sin restricción de ventana de tiempo.
 * La lista de ejercicios se reemplaza por completo (no hay diff incremental).
 */
export async function actualizarSesionKinesiologia(id, { ejercicios, ...checklist }) {
  const sesion = await SesionKinesiologica.findByPk(id);
  if (!sesion) return { ok: false, codigo: "NO_EXISTE", mensaje: "La sesión no existe" };

  await sequelize.transaction(async (t) => {
    await sesion.update({ ...checklist, actualizado_en: new Date() }, { transaction: t });

    if (ejercicios) {
      await SesionKinesiologicaEjercicio.destroy({ where: { sesion_id: id }, transaction: t });
      if (ejercicios.length) {
        await SesionKinesiologicaEjercicio.bulkCreate(
          ejercicios.map((ej, i) => ({ ...ej, sesion_id: id, orden: i })),
          { transaction: t }
        );
      }
    }
  });

  await sesion.reload({ include: INCLUDE_EJERCICIOS_SESION });
  return { ok: true, mensaje: "Sesión actualizada correctamente", sesion };
}
