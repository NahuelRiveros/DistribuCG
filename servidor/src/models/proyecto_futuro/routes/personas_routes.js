// =============================================================
// routes/personas_routes.js
// Ejemplo completo de cómo usar el CRUD genérico para una entidad
// de dominio: Persona.
//
// PARA ACTIVAR ESTE ROUTER:
//   1. Crear los modelos del dominio personas (ver "MODELOS NECESARIOS" abajo)
//   2. Agregarlos a models/index.js y database/bootstrap.js
//   3. Descomentar las importaciones de modelos abajo
//   4. Montar el router en routes/index.js:
//        import { personasRouter } from "./personas_routes.js";
//        router.use("/personas", requireAuth, personasRouter);
//
// =============================================================
//
// MODELOS NECESARIOS (ejemplo de estructura):
//
//   AUTH_01_ROL (ya existe)
//   PERS_01_SEXO       → ID_PERS01, PERS01_DESCRI, PERS01_ABREVIATURA, PERS01_FECHABAJA
//   PERS_02_ESTADO_CIVIL → ID_PERS02, PERS02_DESCRI, PERS02_ABREVIATURA, PERS02_FECHABAJA
//   PERS_03_PERSONA    → ID_PERS03, RELA_PERS01 (sexo), RELA_PERS02 (estado civil),
//                        PERS03_NOMBRE, PERS03_APELLIDO, PERS03_FECHANAC,
//                        PERS03_FECHAALTA, PERS03_FECHABAJA
//
// =============================================================

import { Router } from "express";

// ─── Descomentar cuando los modelos existan ───────────────────
// import {
//   Pers03Persona,
//   Pers01Sexo,
//   Pers02EstadoCivil,
// } from "../models/index.js";

import {
  crearListController,
  crearListPaginadoController,
  crearGetByIdController,
  crearCreateController,
  crearUpdateController,
  crearSoftDeleteController,
  crearReactivarController,
} from "../controllers/generic_controller.js";

import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { ACCESS } from "./access_roles.js";

export const personasRouter = Router();

// =============================================================
// CONFIGURACIÓN DE LA ENTIDAD
// =============================================================
//
// Este objeto define TODO el comportamiento del ABM para la entidad.
// No hay código repetido: solo configuración declarativa.

const PERSONAS_CONFIG = {
  // Modelo Sequelize (requerido)
  // model: Pers03Persona,
  model: null, // ← reemplazar por el modelo real

  // Nombre legible para los mensajes de respuesta
  nombre: "personas",

  // Filtro base que se aplica en todos los listados
  // (solo registros activos — sin fecha de baja)
  where: { PERS03_FECHABAJA: null },

  // Columnas que se devuelven en los listados y por ID
  // (undefined = todas las columnas)
  attributes: [
    "ID_PERS03",
    "PERS03_NOMBRE",
    "PERS03_APELLIDO",
    "PERS03_FECHANAC",
    "PERS03_FECHAALTA",
  ],

  // Joins: incluir sexo y estado civil en cada consulta
  // Descomentar cuando los modelos existan
  include: [
    // {
    //   model: Pers01Sexo,
    //   as:    "sexo",
    //   attributes: ["ID_PERS01", "PERS01_DESCRI"],
    // },
    // {
    //   model: Pers02EstadoCivil,
    //   as:    "estadoCivil",
    //   attributes: ["ID_PERS02", "PERS02_DESCRI"],
    // },
  ],

  // Orden por defecto
  order: [
    ["PERS03_APELLIDO", "ASC"],
    ["PERS03_NOMBRE",   "ASC"],
  ],

  // Campos habilitados para búsqueda por texto: GET /personas/paginado?q=juan
  // Usa Op.iLike internamente → solo PostgreSQL
  searchableFields: [
    "PERS03_NOMBRE",
    "PERS03_APELLIDO",
  ],

  // Filtros dinámicos desde query params:
  //   GET /personas/paginado?sexo_id=1&estado_civil_id=2
  // Solo se aceptan los filtros declarados aquí (seguridad).
  allowedFilters: {
    sexo_id:         "RELA_PERS01",
    estado_civil_id: "RELA_PERS02",
  },

  // Campo de baja lógica
  campoFechaBaja: "PERS03_FECHABAJA",

  // Whitelist de campos permitidos al crear
  createFields: [
    "RELA_PERS01",         // FK sexo
    "RELA_PERS02",         // FK estado civil
    "PERS03_NOMBRE",
    "PERS03_APELLIDO",
    "PERS03_FECHANAC",
  ],

  // Whitelist de campos permitidos al actualizar
  updateFields: [
    "RELA_PERS01",
    "RELA_PERS02",
    "PERS03_NOMBRE",
    "PERS03_APELLIDO",
    "PERS03_FECHANAC",
  ],

  // Hard delete deshabilitado para personas (solo baja lógica)
  allowHardDelete: false,
};

// =============================================================
// REGISTRO DE RUTAS
// =============================================================
//
// Cada línea genera un endpoint completo.
// No hay código de controller ni service para esta entidad.

// GET /api/personas
// → Devuelve todas las personas activas, con sexo y estado civil.
personasRouter.get(
  "/",
  requireRole(...ACCESS.CATALOGOS_GET),
  crearListController(PERSONAS_CONFIG)
);

// GET /api/personas/paginado?page=1&limit=10&q=juan&sexo_id=1
// → Paginado con búsqueda de texto y filtros dinámicos.
// ⚠️  Esta ruta va ANTES de /:id para que Express no confunda
//    "paginado" con un ID.
personasRouter.get(
  "/paginado",
  requireRole(...ACCESS.CATALOGOS_GET),
  crearListPaginadoController(PERSONAS_CONFIG)
);

// GET /api/personas/:id
// → Devuelve una persona por su PK con los joins incluidos.
personasRouter.get(
  "/:id",
  requireRole(...ACCESS.CATALOGOS_GET),
  crearGetByIdController(PERSONAS_CONFIG)
);

// POST /api/personas
// Body: { RELA_PERS01, RELA_PERS02, PERS03_NOMBRE, PERS03_APELLIDO, PERS03_FECHANAC }
// → Solo se aceptan los campos declarados en createFields.
personasRouter.post(
  "/",
  requireRole(...ACCESS.CATALOGOS_CREATE),
  crearCreateController(PERSONAS_CONFIG)
);

// PUT /api/personas/:id
// Body: { PERS03_NOMBRE, PERS03_APELLIDO, ... } (campos de updateFields)
// → Solo se actualizan los campos declarados en updateFields.
personasRouter.put(
  "/:id",
  requireRole(...ACCESS.CATALOGOS_UPDATE),
  crearUpdateController(PERSONAS_CONFIG)
);

// DELETE /api/personas/:id
// → Baja lógica: setea PERS03_FECHABAJA = NOW().
// → NO elimina el registro de la base de datos.
personasRouter.delete(
  "/:id",
  requireRole(...ACCESS.CATALOGOS_DELETE),
  crearSoftDeleteController(PERSONAS_CONFIG)
);

// PUT /api/personas/:id/reactivar
// → Deshace la baja lógica: setea PERS03_FECHABAJA = null.
personasRouter.put(
  "/:id/reactivar",
  requireRole(...ACCESS.CATALOGOS_DELETE),
  crearReactivarController(PERSONAS_CONFIG)
);

// =============================================================
// REFERENCIAS RÁPIDAS — REQUESTS DE EJEMPLO
// =============================================================
//
// GET /api/personas
//   → Lista todas las personas activas
//
// GET /api/personas/paginado?page=1&limit=10
//   → Página 1, 10 registros por página
//
// GET /api/personas/paginado?page=1&limit=10&q=juan
//   → Busca "juan" en nombre y apellido
//
// GET /api/personas/paginado?page=1&limit=10&q=juan&sexo_id=1
//   → Combina búsqueda por texto + filtro por sexo
//
// GET /api/personas/42
//   → Persona con ID_PERS03 = 42
//
// POST /api/personas
//   Body: {
//     "RELA_PERS01": 1,
//     "RELA_PERS02": 1,
//     "PERS03_NOMBRE": "Juan",
//     "PERS03_APELLIDO": "Pérez",
//     "PERS03_FECHANAC": "1990-05-15"
//   }
//
// PUT /api/personas/42
//   Body: { "PERS03_NOMBRE": "Juan Carlos" }
//   → Actualiza solo el nombre (los demás campos no cambian)
//
// DELETE /api/personas/42
//   → Baja lógica: la persona queda inactiva pero en la DB
//
// PUT /api/personas/42/reactivar
//   → Reactiva la persona dada de baja
//
// =============================================================
//
// CUÁNDO AGREGAR UN SERVICE ESPECÍFICO:
//
// Si en el futuro necesitás:
//   - Validar que no haya duplicados por DNI antes de crear
//   - Enviar un email al dar de alta una persona
//   - Actualizar otras tablas en la misma transacción
//   - Lógica de negocio antes/después de crear/modificar
//
// Entonces:
//   1. Crear src/services/personas_service.js
//   2. Importar las funciones genéricas que necesites:
//        import { crearGenerico, buscarUnoGenerico } from "./generic_service.js";
//   3. Combinarlas con tu lógica propia dentro de una transacción
//   4. Crear src/controllers/personas_controller.js y registrar la ruta custom
//
// El CRUD genérico y el service propio conviven sin problema.
// =============================================================
