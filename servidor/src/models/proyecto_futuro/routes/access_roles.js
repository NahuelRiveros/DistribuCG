// ==========================================================
// NIVELES DE PRIVILEGIO (convención del sistema)
//
// Cada rol en la DB tiene AUTH01_NIVEL (0-100).
// requireNivel(N) → pasa cualquier rol con nivel >= N.
// Esto hace que STF1, STF2, STF3... todos con nivel 50
// pasen requireNivel(50) sin listarse individualmente.
//
// Convención estándar:
//   100 → Administrador total
//    50 → Staff (nivel intermedio — cada proyecto define sus roles)
//    10 → Usuario básico
//     0 → Sin rol (bloqueado)
// ==========================================================

export const NIVELES = {
  SUPER_ADMIN: 200,
  ADMIN:       100,
  STAFF:        50,
  USR:          10,
};

// ==========================================================
// ROLES FIJOS DEL SISTEMA (abreviaturas)
//
// Solo ADM y USR son universales. Los roles de "staff" los
// define cada proyecto en seed_auth_roles.js o vía API.
//
// Para agregar un rol del proyecto:
//   export const ROLES = { ..., CAJA: "CAJ", RECEP: "RCP" };
// ==========================================================

export const ROLES = {
  SUPER_ADMIN: "SADM",
  ADMIN:       "ADM",
  VENDEDOR:    "VND",
  USR:         "USR",
};

// ==========================================================
// MATRIZ DE PERMISOS
//
// Cada entrada acepta:
//   { nivel: N }              → requireNivel internamente
//   { roles: ["ADM", "CAJ"] } → requireRole internamente
//   { nivel: N, roles: [...] } → pasa si cumple CUALQUIERA
//
// Uso en rutas:
//   router.get("/ruta", requireAuth, requireAccess(ACCESS.X), handler)
//
// CÓMO AGREGAR UN MÓDULO NUEVO:
//   1. Crear el rol en DB si hace falta (POST /api/catalogos/roles con AUTH01_NIVEL)
//   2. Declarar la abreviatura en ROLES si lo usarás con exactitud
//   3. Agregar las claves en ACCESS usando { nivel } o { roles }
//   4. Usar requireAccess(ACCESS.TU_MODULO_ACCION) en la ruta
//
// EJEMPLOS para un proyecto con "Recepcionista (RCP)" y "Cajero (CAJ)":
//   RESERVAS_GET:    { nivel: NIVELES.STAFF }       // cualquier staff
//   RESERVAS_CREATE: { roles: [ROLES.ADMIN, "RCP"] } // solo admin o recepcionista
//   CAJA_GET:        { roles: [ROLES.ADMIN, "CAJ"] } // solo admin o cajero
//   REPORTES:        { nivel: NIVELES.ADMIN }        // solo admin (nivel 100)
// ==========================================================

export const ACCESS = {
  // ─── USUARIOS ──────────────────────────────────────────
  // nivel >= 100: tanto ADM como SADM pueden gestionar usuarios
  USUARIOS_GET:    { nivel: NIVELES.ADMIN },
  USUARIOS_CREATE: { nivel: NIVELES.ADMIN },
  USUARIOS_UPDATE: { nivel: NIVELES.ADMIN },
  USUARIOS_DELETE: { nivel: NIVELES.ADMIN },
  USUARIOS_ROLES:  { nivel: NIVELES.ADMIN },

  // ─── ROLES (catálogo) ──────────────────────────────────
  // nivel >= 100: tanto ADM como SADM pueden crear/editar/eliminar roles
  ROLES_GET:    { nivel: NIVELES.ADMIN },
  ROLES_CREATE: { nivel: NIVELES.ADMIN },
  ROLES_UPDATE: { nivel: NIVELES.ADMIN },
  ROLES_DELETE: { nivel: NIVELES.ADMIN },

  // ─── CATÁLOGOS GENÉRICOS ───────────────────────────────
  CATALOGOS_GET:    { nivel: NIVELES.USR   },
  CATALOGOS_CREATE: { nivel: NIVELES.STAFF },
  CATALOGOS_UPDATE: { nivel: NIVELES.STAFF },
  CATALOGOS_DELETE: { roles: [ROLES.ADMIN] },

  // ─── CATÁLOGOS DE PRODUCTOS (públicos → solo write protegido) ──
  CATEGORIAS_CREATE: [ROLES.ADMIN],
  CATEGORIAS_UPDATE: [ROLES.ADMIN],
  CATEGORIAS_DELETE: [ROLES.ADMIN],

  GENEROS_CREATE: [ROLES.ADMIN],
  GENEROS_UPDATE: [ROLES.ADMIN],
  GENEROS_DELETE: [ROLES.ADMIN],

  TALLES_CREATE: [ROLES.ADMIN],
  TALLES_UPDATE: [ROLES.ADMIN],
  TALLES_DELETE: [ROLES.ADMIN],

  COLORES_CREATE: [ROLES.ADMIN],
  COLORES_UPDATE: [ROLES.ADMIN],
  COLORES_DELETE: [ROLES.ADMIN],

  MARCAS_CREATE: [ROLES.ADMIN],
  MARCAS_UPDATE: [ROLES.ADMIN],
  MARCAS_DELETE: [ROLES.ADMIN],

  // ─── CATÁLOGOS INTERNOS ────────────────────────────────
  ESTADOS_ORDEN_GET:    [ROLES.ADMIN],
  ESTADOS_ORDEN_CREATE: [ROLES.ADMIN],
  ESTADOS_ORDEN_UPDATE: [ROLES.ADMIN],

  CONDICION_IVA_GET: [ROLES.ADMIN, ROLES.USR],

  TIPO_COMP_GET: [ROLES.ADMIN],

  PUNTO_VENTA_GET:    [ROLES.ADMIN],
  PUNTO_VENTA_CREATE: [ROLES.ADMIN],
  PUNTO_VENTA_UPDATE: [ROLES.ADMIN],
  PUNTO_VENTA_DELETE: [ROLES.ADMIN],

  ENVIO_OPCION_GET:    [ROLES.ADMIN, ROLES.USR],
  ENVIO_OPCION_CREATE: [ROLES.ADMIN],
  ENVIO_OPCION_UPDATE: [ROLES.ADMIN],
  ENVIO_OPCION_DELETE: [ROLES.ADMIN],

  // ─── CARRITO ───────────────────────────────────────────
  CARRITO: [ROLES.ADMIN, ROLES.USR],

  // ─── ÓRDENES ───────────────────────────────────────────
  ORDENES_CREATE: [ROLES.ADMIN, ROLES.USR],
  ORDENES_READ:   [ROLES.ADMIN, ROLES.USR],
  ORDENES_ADMIN:  [ROLES.ADMIN],

  // ─── PRODUCTOS ─────────────────────────────────────────
  PRODUCTOS_CREATE: [ROLES.ADMIN],
  PRODUCTOS_UPDATE: [ROLES.ADMIN],
  PRODUCTOS_DELETE: [ROLES.ADMIN],
  PRODUCTOS_STOCK:  { nivel: NIVELES.STAFF }, // VND (nivel 50) puede ver y actualizar stock

  // ─── UPLOAD ────────────────────────────────────────────
  UPLOAD_CREATE: [ROLES.ADMIN],
};
