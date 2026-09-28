// Misma regla en servidor (requerirRol) y frontend (rutas y menús):
// super_admin, el dueño de la plataforma, pasa cualquier control de rol.
export function tieneRol(usuario, roles) {
  const propios = usuario?.roles ?? [];
  return propios.includes("super_admin") || propios.some((r) => roles.includes(r));
}

// Quiénes entran al panel de administración.
export const ROLES_PANEL = ["admin", "staff"];
