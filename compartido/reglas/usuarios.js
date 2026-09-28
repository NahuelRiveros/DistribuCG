// Quién puede gestionar a quién en "Usuarios" del panel. La usan el servidor
// (rechaza) y el panel (oculta los botones), así nunca se contradicen.

// En la base un usuario puede tener varios roles; en el panel se elige uno solo.
export const ROLES_ASIGNABLES = {
  admin: "Administrador",
  staff: "Personal",
  cliente: "Cliente",
};

export const ETIQUETAS_ROL = { super_admin: "Super admin", ...ROLES_ASIGNABLES };

const JERARQUIA = ["super_admin", "admin", "staff", "cliente"];

/** El rol "más alto" del usuario (el que se muestra y se edita en el panel). */
export function rolPrincipal(roles = []) {
  return JERARQUIA.find((r) => roles.includes(r)) ?? null;
}

/** Roles que `actor` puede dar: el super admin, cualquiera; un admin, solo personal o cliente. */
export function rolesQuePuedeAsignar(actor) {
  const rol = rolPrincipal(actor?.roles);
  if (rol === "super_admin") return ["admin", "staff", "cliente"];
  if (rol === "admin") return ["staff", "cliente"];
  return [];
}

/** null si `actor` puede modificar a `objetivo`; si no, el motivo para mostrar. */
export function problemaGestion(actor, objetivo) {
  if (actor?.id === objetivo.id) return "Tu propio usuario no se modifica desde acá.";
  const rol = rolPrincipal(objetivo.roles);
  if (rol === "super_admin") return "El super admin no se puede modificar desde el panel.";
  if (!rolesQuePuedeAsignar(actor).includes(rol)) return "Solo el super admin puede modificar a otro administrador.";
  return null;
}
