// Traído de DistribuCG (services/common/pagination.js), con nombres en español.

export function normalizarPaginacion({ pagina, limite, limiteMaximo = 100, limitePorDefecto = 20 } = {}) {
  const p = Math.min(1_000_000, Math.max(1, Math.floor(Number(pagina)) || 1));
  const l = Math.min(limiteMaximo, Math.max(1, Math.floor(Number(limite)) || limitePorDefecto));
  return { pagina: p, limite: l, offset: (p - 1) * l };
}

export function armarPaginacion({ pagina, limite, total }) {
  return { pagina, limite, total, total_paginas: Math.ceil(total / limite) };
}
