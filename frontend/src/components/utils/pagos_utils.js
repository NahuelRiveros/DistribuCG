export function normalizarDocumento(documento) {
  return String(documento ?? "").replace(/[.\s]/g, "").trim();
}

export function calcularNuevoPlanDesdeHoy(diasTotales) {
  const dias = Number(diasTotales || 0);

  if (!dias || dias <= 0) {
    return {
      inicioEstimado: null,
      vencimientoEstimado: null,
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(hoy);
  vencimiento.setDate(vencimiento.getDate() + dias - 1);

  return {
    inicioEstimado: hoy,
    vencimientoEstimado: vencimiento,
  };
}

export function obtenerPrecioPlan(planSeleccionado) {
  return Number(
    planSeleccionado?.precio ??
      planSeleccionado?.monto ??
      planSeleccionado?.precio_plan ??
      0
  );
}