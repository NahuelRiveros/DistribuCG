// =============================================================
// routes/admin_routes.js
//
// Rutas de administración del sistema.
//
// Jerarquía de roles → ADM:
//   GET  /api/admin/roles/jerarquia      → estructura y permisos de cada nivel
//
// Suscripción → solo SADM (Super Admin, dueño del sistema):
//   GET    /api/admin/suscripcion           → estado actual
//   POST   /api/admin/suscripcion/activar   → activar/renovar N días
//   PUT    /api/admin/suscripcion/gracia    → cambiar días de gracia
//   DELETE /api/admin/suscripcion           → eliminar suscripción
//   GET    /api/admin/suscripcion/historial → últimas 50 acciones
// =============================================================

import { Router } from "express";

import {
  estadoSuscripcionController,
  activarSuscripcionController,
  actualizarGraciaController,
  eliminarSuscripcionController,
  historialController,
} from "../controllers/suscripcion_controller.js";

import { requireAuth, requireRole, requireNivel } from "../middleware/auth_middleware.js";
import { ROLES, NIVELES } from "./access_roles.js";

export const adminRouter = Router();

// ── Jerarquía de roles — disponible para nivel >= 100 ───────
adminRouter.get("/roles/jerarquia", requireAuth, requireNivel(NIVELES.ADMIN), (_req, res) => {
  return res.json({
    ok: true,
    data: {
      descripcion: "Roles del sistema. Mayor nivel = más permisos. Un usuario puede tener varios roles activos.",
      regla_acceso: "Cualquier usuario con nivel >= 100 puede gestionar usuarios y roles. SADM (200) además gestiona la suscripción del sistema.",
      jerarquia: [
        {
          abreviatura: "SADM",
          nombre:      "Super Administrador",
          nivel:       NIVELES.SUPER_ADMIN,
          creado_por:  "Sistema automáticamente al iniciar",
          permisos: [
            "Todo lo que puede ADM (nivel 200 >= 100)",
            "Gestionar la suscripción del sistema (exclusivo)",
            "Activar / renovar suscripción",
            "Modificar días de gracia",
          ],
          protegido: true,
        },
        {
          abreviatura: "ADM",
          nombre:      "Administrador",
          nivel:       NIVELES.ADMIN,
          creado_por:  "Manualmente por SADM desde el panel de usuarios",
          permisos: [
            "Gestionar usuarios (crear, editar, asignar roles, eliminar)",
            "Crear y administrar roles personalizados",
            "Gestionar catálogos (categorías, talles, colores, marcas, etc.)",
            "Gestionar productos, stock y precios",
            "Ver y gestionar órdenes",
            "Configurar puntos de venta y opciones de envío",
          ],
          protegido: true,
        },
        {
          abreviatura: "(personalizado)",
          nombre:      "Staff / roles del negocio",
          nivel:       "11 a 99 (configurable)",
          creado_por:  "ADM o SADM vía POST /api/catalogos/roles",
          permisos: [
            "Acceso intermedio según lo que configure el administrador",
            "Ejemplos: Vendedor (VND n50), Repositor (REP n50), Recepcionista (RCP n50)",
          ],
          protegido: false,
        },
        {
          abreviatura: "USR",
          nombre:      "Usuario",
          nivel:       NIVELES.USR,
          creado_por:  "Sistema automáticamente al registrarse",
          permisos: [
            "Ver catálogo de productos",
            "Gestionar su propio carrito",
            "Crear y ver sus propias órdenes",
            "Editar su perfil y contraseña",
          ],
          protegido: true,
        },
      ],
      crear_rol_personalizado: {
        metodo: "POST",
        url:    "/api/catalogos/roles",
        body:   { AUTH01_NOMBRE: "Vendedor", AUTH01_ABREVIATURA: "VND", AUTH01_NIVEL: 50 },
        notas:  "AUTH01_NIVEL entre 11 y 99 para staff. La abreviatura debe ser única y en mayúsculas.",
      },
    },
  });
});

// ── Suscripción — exclusivo del Super Admin (SADM) ──────────
adminRouter.get(   "/suscripcion",         requireAuth, requireRole(ROLES.SUPER_ADMIN), estadoSuscripcionController);
adminRouter.post(  "/suscripcion/activar", requireAuth, requireRole(ROLES.SUPER_ADMIN), activarSuscripcionController);
adminRouter.put(   "/suscripcion/gracia",  requireAuth, requireRole(ROLES.SUPER_ADMIN), actualizarGraciaController);
adminRouter.delete("/suscripcion",         requireAuth, requireRole(ROLES.SUPER_ADMIN), eliminarSuscripcionController);
adminRouter.get(   "/suscripcion/historial", requireAuth, requireRole(ROLES.SUPER_ADMIN), historialController);
