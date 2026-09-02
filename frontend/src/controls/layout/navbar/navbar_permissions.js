import { moduloHabilitado } from "../../../config/modulos_config.js";

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

function puedeVerItem(item, usuario, modulosHabilitados) {
  const estaAutenticado = Boolean(usuario);
  if (item.ocultarSiAuth && estaAutenticado) return false;
  if (item.requiereAuth && !estaAutenticado) return false;
  if (!moduloHabilitado(item.modulo, modulosHabilitados)) return false;
  if (!item.roles || item.roles.length === 0) return true;
  const rolesUsuario = getRolesUsuario(usuario);
  return item.roles.some((r) => rolesUsuario.includes(normalizarRol(r)));
}

// Filtra un item y, si tiene `children` (grupo dentro de un dropdown), filtra
// también cada hijo por su propio rol/módulo — un grupo visible no debe dejar
// pasar hijos que el usuario no debería ver. Grupos que quedan sin hijos se descartan.
function filtrarItemConHijos(item, usuario, modulosHabilitados) {
  if (!puedeVerItem(item, usuario, modulosHabilitados)) return null;
  if (!item.children?.length) return item;

  const children = item.children.filter((child) => puedeVerItem(child, usuario, modulosHabilitados));
  if (children.length === 0) return null;

  return { ...item, children };
}

export function filtrarNavbarPorRol(config, usuario, modulosHabilitados) {
  const links = (config.links ?? []).filter((link) => puedeVerItem(link, usuario, modulosHabilitados));

  const dropdowns = (config.dropdowns ?? [])
    .map((dropdown) => {
      const label = usuario
        ? (dropdown.labelAuth ?? dropdown.label ?? dropdown.labelNoAuth ?? "")
        : (dropdown.labelNoAuth ?? dropdown.label ?? dropdown.labelAuth ?? "");
      return {
        ...dropdown,
        label,
        items: (dropdown.items ?? [])
          .map((item) => filtrarItemConHijos(item, usuario, modulosHabilitados))
          .filter(Boolean),
      };
    })
    .filter((dropdown) => dropdown.items.length > 0);

  return { ...config, links, dropdowns };
}
