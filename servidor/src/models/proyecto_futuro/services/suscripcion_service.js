import { Auth06Suscripcion, Auth07SuscripcionLog } from "../models/index.js";

// ==========================================================
// ESTADOS DE SUSCRIPCIÓN
// ==========================================================

export const ESTADO_SUSCRIPCION = {
  ACTIVO:           "ACTIVO",
  GRACIA:           "GRACIA",   // fecha vencida pero dentro del período de gracia mensual
  VENCIDO:          "VENCIDO",  // fecha vencida y fuera del período de gracia
  SIN_SUSCRIPCION:  "SIN_SUSCRIPCION", // nunca se activó
};

// ==========================================================
// CALCULAR ESTADO (lógica pura, sin DB)
//
// Regla del período de gracia:
//   Cada mes, del día 1 al AUTH06_DIAS_GRACIA, el sistema está en
//   modo GRACIA (lectura habilitada, escritura bloqueada).
//   Pasado ese día, queda en VENCIDO hasta el 1 del siguiente mes.
// ==========================================================

export function calcularEstado(suscripcion) {
  if (!suscripcion) return ESTADO_SUSCRIPCION.SIN_SUSCRIPCION;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaFin = new Date(suscripcion.AUTH06_FECHA_FIN);
  fechaFin.setHours(0, 0, 0, 0);

  if (fechaFin >= hoy) return ESTADO_SUSCRIPCION.ACTIVO;

  const diaDelMes   = hoy.getDate();
  const diasGracia  = suscripcion.AUTH06_DIAS_GRACIA ?? 10;

  return diaDelMes <= diasGracia
    ? ESTADO_SUSCRIPCION.GRACIA
    : ESTADO_SUSCRIPCION.VENCIDO;
}

// ==========================================================
// CALCULAR DÍAS RESTANTES EN PERÍODO DE GRACIA
// ==========================================================

export function diasRestantesGracia(suscripcion) {
  if (!suscripcion) return 0;
  const hoy        = new Date();
  const diasGracia = suscripcion.AUTH06_DIAS_GRACIA ?? 10;
  const diaDelMes  = hoy.getDate();
  return Math.max(0, diasGracia - diaDelMes);
}

// ==========================================================
// CALCULAR DÍAS RESTANTES HASTA EL VENCIMIENTO
// ==========================================================

export function diasHastaVencimiento(suscripcion) {
  if (!suscripcion) return null;
  const hoy      = new Date(); hoy.setHours(0, 0, 0, 0);
  const fechaFin = new Date(suscripcion.AUTH06_FECHA_FIN); fechaFin.setHours(0, 0, 0, 0);
  const diff     = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

// ==========================================================
// OBTENER SUSCRIPCIÓN ACTUAL (única fila en la tabla)
// ==========================================================

export async function getSuscripcion() {
  return await Auth06Suscripcion.findOne({
    order: [["ID_AUTH06", "DESC"]],
  });
}

// ==========================================================
// OBTENER ESTADO ACTUAL (para el middleware)
// Devuelve { estado, suscripcion, diasRestantesGracia }
// ==========================================================

export async function getSuscripcionEstado() {
  const suscripcion = await getSuscripcion();
  const estado      = calcularEstado(suscripcion);
  const gracia      = diasRestantesGracia(suscripcion);

  return { estado, suscripcion, diasRestantesGracia: gracia };
}

// ==========================================================
// ACTIVAR / RENOVAR SUSCRIPCIÓN
//
// Si ya existe un registro:
//   - Extiende desde max(fecha_fin_actual, hoy) + dias
//   - Incrementa el contador de renovaciones
// Si no existe: crea el primer registro desde hoy.
//
// Body esperado: { dias: 30, notas?: "Pagó el 5 vía transferencia" }
// ==========================================================

// ==========================================================
// REGISTRAR LOG DE ACCIÓN
// ==========================================================

export async function registrarLog({ accion, dias, fechaFinResult, notas, emailSadm }) {
  await Auth07SuscripcionLog.create({
    AUTH07_ACCION:          accion,
    AUTH07_DIAS:            dias          ?? null,
    AUTH07_FECHA_FIN_RESULT: fechaFinResult ?? null,
    AUTH07_NOTAS:           notas         ?? null,
    AUTH07_EMAIL:           emailSadm,
    AUTH07_FECHA:           new Date(),
  });
}

// ==========================================================
// OBTENER HISTORIAL DE ACCIONES
// ==========================================================

export async function getHistorial() {
  return await Auth07SuscripcionLog.findAll({
    order: [["AUTH07_FECHA", "DESC"]],
    limit: 50,
  });
}

// ==========================================================
// ELIMINAR SUSCRIPCIÓN (borra todos los registros de la tabla)
// Deja el sistema en estado SIN_SUSCRIPCION.
// ==========================================================

export async function eliminarSuscripcion() {
  const eliminados = await Auth06Suscripcion.destroy({ where: {}, truncate: true });
  return { ok: true, mensaje: "Suscripción eliminada. El sistema queda sin suscripción activa.", eliminados };
}

export async function activarSuscripcion({ dias, notas, emailSadm }) {
  const cantDias = Number(dias);

  if (!cantDias || cantDias < 1 || cantDias > 365) {
    return { ok: false, mensaje: "El campo dias debe ser un número entre 1 y 365" };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const existente = await getSuscripcion();

  if (existente) {
    const fechaFinActual = new Date(existente.AUTH06_FECHA_FIN);
    fechaFinActual.setHours(0, 0, 0, 0);

    // Extender desde la fecha fin actual o desde hoy, la que sea mayor
    const base    = fechaFinActual >= hoy ? fechaFinActual : hoy;
    const nuevaFin = new Date(base);
    nuevaFin.setDate(nuevaFin.getDate() + cantDias);

    const nuevaFinStr = nuevaFin.toISOString().split("T")[0];
    await existente.update({
      AUTH06_FECHA_FIN:    nuevaFinStr,
      AUTH06_RENOVACIONES: (existente.AUTH06_RENOVACIONES ?? 0) + 1,
      AUTH06_NOTAS:        notas ?? existente.AUTH06_NOTAS,
    });

    await registrarLog({ accion: "RENOVAR", dias: cantDias, fechaFinResult: nuevaFinStr, notas, emailSadm });

    return {
      ok: true,
      mensaje: `Suscripción renovada por ${cantDias} días`,
      data: {
        fecha_inicio:  existente.AUTH06_FECHA_INICIO,
        fecha_fin:     nuevaFinStr,
        renovaciones:  existente.AUTH06_RENOVACIONES,
        estado:        ESTADO_SUSCRIPCION.ACTIVO,
      },
    };
  }

  // Primera activación
  const fechaFin = new Date(hoy);
  fechaFin.setDate(fechaFin.getDate() + cantDias);
  const fechaFinStr = fechaFin.toISOString().split("T")[0];

  const nueva = await Auth06Suscripcion.create({
    AUTH06_FECHA_INICIO:  hoy.toISOString().split("T")[0],
    AUTH06_FECHA_FIN:     fechaFinStr,
    AUTH06_DIAS_GRACIA:   10,
    AUTH06_RENOVACIONES:  1,
    AUTH06_NOTAS:         notas ?? null,
  });

  await registrarLog({ accion: "ACTIVAR", dias: cantDias, fechaFinResult: fechaFinStr, notas, emailSadm });

  return {
    ok: true,
    mensaje: `Suscripción activada por ${cantDias} días`,
    data: {
      fecha_inicio: nueva.AUTH06_FECHA_INICIO,
      fecha_fin:    nueva.AUTH06_FECHA_FIN,
      renovaciones: nueva.AUTH06_RENOVACIONES,
      estado:       ESTADO_SUSCRIPCION.ACTIVO,
    },
  };
}
