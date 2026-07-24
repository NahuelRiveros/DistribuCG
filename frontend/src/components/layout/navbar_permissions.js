function normalizarRol(valor) {
  return String(valor || "").trim().toLowerCase();
}

function getRolesUsuario(usuario) {
  if (Array.isArray(usuario?.roles) && usuario.roles.length > 0) {
    return usuario.roles.map(normalizarRol);
  }
  const rol = normalizarRol(
    usuario?.rol_nombre || usuario?.rol || usuario?.role || usuario?.tipoDesc || usuario?.tipo || ""
  );
  return rol ? [rol] : [];
}

function puedeVerItem(item, usuario) {
  const estaAutenticado = Boolean(usuario);
  if (item.ocultarSiAuth && estaAutenticado) return false;
  if (item.requiereAuth && !estaAutenticado) return false;
  if (!item.roles || item.roles.length === 0) return true;
  const rolesUsuario = getRolesUsuario(usuario);
  return item.roles.some((r) => rolesUsuario.includes(normalizarRol(r)));
}

export function filtrarNavbarPorRol(config, usuario) {
  const links = (config.links ?? []).filter((link) => puedeVerItem(link, usuario));

  const dropdowns = (config.dropdowns ?? [])
    .map((dropdown) => {
      const label = usuario
        ? (dropdown.labelAuth ?? dropdown.label ?? dropdown.labelNoAuth ?? "")
        : (dropdown.labelNoAuth ?? dropdown.label ?? dropdown.labelAuth ?? "");
      return {
        ...dropdown,
        label,
        items: (dropdown.items ?? []).filter((item) => puedeVerItem(item, usuario)),
      };
    })
    .filter((dropdown) => dropdown.items.length > 0);

  return { ...config, links, dropdowns };
}
