// Los E2E corren contra su propia base (schema aparte) y puertos propios,
// así no tocan los datos de desarrollo ni chocan con `npm run dev`.
export const ESQUEMA_E2E = "mi_eccomerce_e2e";
export const PUERTO_API = 3101;
export const PUERTO_WEB = 5175;
export const ADMIN_E2E = { nombre: "Admin E2E", email: "admin-e2e@local.test", contrasena: "clave-e2e-123" };
