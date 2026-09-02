// =============================================================
// routes/catalogos_routes.js
//
// Catálogos base del sistema usando el CRUD genérico.
// Para agregar un catálogo nuevo:
//   1. Crear el modelo en models/
//   2. Agregarlo a models/index.js y database/bootstrap.js
//   3. Definir su CONFIG acá y registrar las rutas
//
// NOTA de auth:
//   - GET de catálogos de productos (categorías, géneros, talles,
//     opciones de envío) son PÚBLICOS → sin requireAuth (los usa el
//     frontend sin que el usuario esté logueado).
//   - GET de catálogos internos (estados de orden, condición IVA,
//     tipos de comprobante, puntos de venta) requieren estar autenticado.
//   - Todo CREATE / PUT / DELETE requiere rol Administrador.
// =============================================================

import { Router } from "express";

import {
  Auth01Rol,
  Prod01Categoria,
  Prod02Genero,
  Prod03Producto,
  Prod04Talle,
  Prod06Color,
  Ord01Estado,
  Ord02CondicionIva,
  Fact01TipoComp,
  Fact02PuntoVenta,
  Envio01Opcion,
  Prod07Marca,
  Prod08CategoriaGenero,
} from "../models/index.js";

import {
  crearListController,
  crearListPaginadoController,
  crearGetByIdController,
  crearCreateController,
  crearUpdateController,
  crearSoftDeleteController,
  crearReactivarController,
} from "../controllers/generic_controller.js";

import { requireAuth, requireRole, requireAccess, requireNivel } from "../middleware/auth_middleware.js";
import { ACCESS, NIVELES } from "./access_roles.js";

export const catalogosRouter = Router();

// Roles del sistema: no se pueden editar ni eliminar vía API
const ROLES_SISTEMA = ["SADM", "ADM", "USR"];

// Nivel máximo permitido para roles personalizados (staff).
// Los niveles >= 100 están reservados para roles del sistema (ADM, SADM).
function validarNivelRol(req, res, next) {
  const nivel = req.body?.AUTH01_NIVEL;
  if (nivel === undefined || nivel === null || nivel === "") return next();
  const n = Number(nivel);
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    return res.status(400).json({
      ok: false,
      codigo: "NIVEL_INVALIDO",
      mensaje: "AUTH01_NIVEL debe ser un entero entre 1 y 99 para roles personalizados",
    });
  }
  return next();
}

async function protegerRolSistema(req, res, next) {
  const rol = await Auth01Rol.findByPk(req.params.id, {
    attributes: ["AUTH01_ABREVIATURA"],
  });
  if (!rol) return next(); // el 404 lo maneja el controller
  if (ROLES_SISTEMA.includes(rol.AUTH01_ABREVIATURA)) {
    return res.status(403).json({
      ok: false,
      codigo: "ROL_SISTEMA",
      mensaje: `El rol "${rol.AUTH01_ABREVIATURA}" es del sistema y no puede modificarse`,
    });
  }
  return next();
}

// =============================================================
// ROLES  [auth requerido]
// GET    /catalogos/roles
// GET    /catalogos/roles/paginado
// GET    /catalogos/roles/:id
// POST   /catalogos/roles                 [ADMIN]
// PUT    /catalogos/roles/:id             [ADMIN — no sistema]
// DELETE /catalogos/roles/:id             [ADMIN — no sistema]
// PUT    /catalogos/roles/:id/reactivar   [ADMIN — no sistema]
// =============================================================

const ROLES_CONFIG = {
  model:           Auth01Rol,
  nombre:          "roles",
  where:           { AUTH01_FECHABAJA: null },
  attributes:      ["ID_AUTH01", "AUTH01_NOMBRE", "AUTH01_ABREVIATURA", "AUTH01_NIVEL"],
  order:           [["AUTH01_NIVEL", "DESC"], ["AUTH01_NOMBRE", "ASC"]],
  campoBusqueda:   "AUTH01_NOMBRE",
  campoFechaBaja:  "AUTH01_FECHABAJA",
  allowHardDelete: false,
  createFields:    ["AUTH01_NOMBRE", "AUTH01_ABREVIATURA", "AUTH01_NIVEL"],
  updateFields:    ["AUTH01_NOMBRE", "AUTH01_ABREVIATURA", "AUTH01_NIVEL"],
};

catalogosRouter.get(   "/roles",               requireAuth, requireAccess(ACCESS.ROLES_GET),    crearListController(ROLES_CONFIG));
catalogosRouter.get(   "/roles/paginado",      requireAuth, requireAccess(ACCESS.ROLES_GET),    crearListPaginadoController(ROLES_CONFIG));
catalogosRouter.get(   "/roles/:id",           requireAuth, requireAccess(ACCESS.ROLES_GET),    crearGetByIdController(ROLES_CONFIG));
catalogosRouter.post(  "/roles",               requireAuth, requireAccess(ACCESS.ROLES_CREATE), validarNivelRol, crearCreateController(ROLES_CONFIG));
catalogosRouter.put(   "/roles/:id",           requireAuth, requireAccess(ACCESS.ROLES_UPDATE), protegerRolSistema, validarNivelRol, crearUpdateController(ROLES_CONFIG));
catalogosRouter.delete("/roles/:id",           requireAuth, requireAccess(ACCESS.ROLES_DELETE), protegerRolSistema, crearSoftDeleteController(ROLES_CONFIG));
catalogosRouter.put(   "/roles/:id/reactivar", requireAuth, requireAccess(ACCESS.ROLES_DELETE), protegerRolSistema, crearReactivarController(ROLES_CONFIG));

// =============================================================
// CATEGORÍAS DE PRODUCTO  [GET público — lo usa el catálogo]
// GET    /catalogos/categorias
// GET    /catalogos/categorias/paginado
// GET    /catalogos/categorias/:id
// POST   /catalogos/categorias        [ADMIN]
// PUT    /catalogos/categorias/:id    [ADMIN]
// DELETE /catalogos/categorias/:id    [ADMIN]
// PUT    /catalogos/categorias/:id/reactivar [ADMIN]
// =============================================================

const CATEGORIAS_CONFIG = {
  model:        Prod01Categoria,
  nombre:       "categorías",
  where:        { PROD01_FECHABAJA: null },
  attributes:   ["ID_PROD01", "PROD01_NOMBRE", "PROD01_SLUG", "RELA_PARENT"],
  order:        [["PROD01_NOMBRE", "ASC"]],
  campoBusqueda:"PROD01_NOMBRE",
  createFields: ["PROD01_NOMBRE", "PROD01_SLUG", "RELA_PARENT", "PROD01_FECHAALTA"],
  updateFields: ["PROD01_NOMBRE", "PROD01_SLUG", "RELA_PARENT"],
};

function mapCategoriaNav(cat, basePath, childrenByParent) {
  const children = childrenByParent.get(cat.ID_PROD01) ?? [];

  return {
    id: cat.ID_PROD01,
    label: cat.PROD01_NOMBRE,
    slug: cat.PROD01_SLUG,
    to: `/${basePath}/${cat.PROD01_SLUG}`,
    children: children.map((child) => mapCategoriaNav(child, basePath, childrenByParent)),
  };
}

// GET /catalogos/navegacion [publico]
// Jerarquia para navbar/home: productos -> categorias y genero -> categorias.
catalogosRouter.get("/navegacion", async (req, res, next) => {
  try {
    const [generos, categorias, relaciones, productosActivos] = await Promise.all([
      Prod02Genero.findAll({
        where: { PROD02_FECHABAJA: null },
        attributes: ["ID_PROD02", "PROD02_NOMBRE", "PROD02_SLUG"],
        order: [["PROD02_NOMBRE", "ASC"]],
      }),
      Prod01Categoria.findAll({
        where: { PROD01_FECHABAJA: null },
        attributes: ["ID_PROD01", "PROD01_NOMBRE", "PROD01_SLUG", "RELA_PARENT"],
        order: [["PROD01_NOMBRE", "ASC"]],
      }),
      Prod08CategoriaGenero.findAll({
        attributes: ["RELA_PROD01", "RELA_PROD02", "PROD08_ORDEN"],
        order: [["PROD08_ORDEN", "ASC"]],
      }),
      Prod03Producto.findAll({
        where: { PROD03_ACTIVO: true, PROD03_FECHABAJA: null },
        attributes: ["RELA_PROD01", "RELA_PROD02"],
      }),
    ]);

    const categoriasById = new Map(categorias.map((cat) => [cat.ID_PROD01, cat]));
    const childrenByParent = new Map();

    categorias.forEach((cat) => {
      if (cat.RELA_PARENT == null) return;
      const children = childrenByParent.get(cat.RELA_PARENT) ?? [];
      children.push(cat);
      childrenByParent.set(cat.RELA_PARENT, children);
    });

    function rootCategoriaId(id) {
      let current = categoriasById.get(id);
      if (!current) return null;

      while (current.RELA_PARENT != null && categoriasById.has(current.RELA_PARENT)) {
        current = categoriasById.get(current.RELA_PARENT);
      }

      return current.ID_PROD01;
    }

    const allRootIds = new Set();
    const rootIdsByGenero = new Map();
    const ordenByGeneroCategoria = new Map();

    function addRootToGenero(generoId, categoriaId, orden = 9999) {
      const rootId = rootCategoriaId(categoriaId);
      if (!rootId) return;

      allRootIds.add(rootId);
      const current = rootIdsByGenero.get(generoId) ?? new Set();
      current.add(rootId);
      rootIdsByGenero.set(generoId, current);

      const key = `${generoId}:${rootId}`;
      ordenByGeneroCategoria.set(key, Math.min(ordenByGeneroCategoria.get(key) ?? orden, orden));
    }

    relaciones.forEach((rel) => {
      addRootToGenero(rel.RELA_PROD02, rel.RELA_PROD01, rel.PROD08_ORDEN ?? 0);
    });

    productosActivos.forEach((producto) => {
      addRootToGenero(producto.RELA_PROD02, producto.RELA_PROD01);
    });

    const sortCategorias = (a, b) => a.PROD01_NOMBRE.localeCompare(b.PROD01_NOMBRE);
    const allItems = Array.from(allRootIds)
      .map((id) => categoriasById.get(id))
      .filter(Boolean)
      .sort(sortCategorias)
      .map((categoria) => mapCategoriaNav(categoria, "catalogo", childrenByParent));

    const data = generos.map((genero) => {
      const rootIds = rootIdsByGenero.get(genero.ID_PROD02) ?? new Set();
      const items = Array.from(rootIds)
        .map((id) => categoriasById.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          const ordenA = ordenByGeneroCategoria.get(`${genero.ID_PROD02}:${a.ID_PROD01}`) ?? 9999;
          const ordenB = ordenByGeneroCategoria.get(`${genero.ID_PROD02}:${b.ID_PROD01}`) ?? 9999;
          return ordenA - ordenB || a.PROD01_NOMBRE.localeCompare(b.PROD01_NOMBRE);
        })
        .map((categoria) => mapCategoriaNav(categoria, genero.PROD02_SLUG, childrenByParent));

      return {
        id: genero.ID_PROD02,
        label: genero.PROD02_NOMBRE,
        slug: genero.PROD02_SLUG,
        to: `/${genero.PROD02_SLUG}`,
        items,
      };
    });

    return res.json({
      ok: true,
      mensaje: "Navegacion de catalogos",
      data: [
        { id: "productos", label: "Productos", slug: "catalogo", to: "/catalogo", items: allItems },
        ...data,
      ],
    });
  } catch (err) { next(err); }
});

catalogosRouter.get(  "/categorias",          crearListController(CATEGORIAS_CONFIG));
catalogosRouter.get(  "/categorias/paginado", crearListPaginadoController(CATEGORIAS_CONFIG));
catalogosRouter.get(  "/categorias/:id",      crearGetByIdController(CATEGORIAS_CONFIG));
catalogosRouter.post( "/categorias",          requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(CATEGORIAS_CONFIG));
catalogosRouter.put(  "/categorias/:id",      requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(CATEGORIAS_CONFIG));

// DELETE /catalogos/categorias/:id [ADMIN] — eliminación definitiva
catalogosRouter.delete("/categorias/:id", requireAuth, requireNivel(NIVELES.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, mensaje: "El parámetro id es requerido" });

    const cat = await Prod01Categoria.findByPk(id);
    if (!cat) return res.status(404).json({ ok: false, mensaje: `No se encontró la categoría con id ${id}` });

    // Bloquear si hay productos que la usan directamente
    const tieneProductos = await Prod03Producto.count({ where: { RELA_PROD01: id } });
    if (tieneProductos > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `No se puede eliminar: hay ${tieneProductos} producto(s) asignado(s) a esta categoría. Reasignálos primero.`,
      });
    }

    // Desasignar subcategorías (las promueve a raíz, no las borra)
    await Prod01Categoria.update({ RELA_PARENT: null }, { where: { RELA_PARENT: id } });

    // Eliminar asignaciones de género
    await Prod08CategoriaGenero.destroy({ where: { RELA_PROD01: id } });

    await cat.destroy();

    return res.json({ ok: true, mensaje: "Categoría eliminada definitivamente", data: null });
  } catch (err) { next(err); }
});

// GET  /catalogos/categorias/:id/generos  — géneros asignados a esa categoría
catalogosRouter.get("/categorias/:id/generos", async (req, res, next) => {
  try {
    const rows = await Prod08CategoriaGenero.findAll({
      where:      { RELA_PROD01: req.params.id },
      attributes: ["RELA_PROD02"],
      order:      [["PROD08_ORDEN", "ASC"]],
    });
    return res.json({ ok: true, mensaje: "Géneros de la categoría", data: rows.map((r) => r.RELA_PROD02) });
  } catch (err) { next(err); }
});

// PUT  /catalogos/categorias/:id/generos  [ADMIN] — reemplaza géneros asignados
catalogosRouter.put("/categorias/:id/generos", requireAuth, requireNivel(NIVELES.ADMIN), async (req, res, next) => {
  try {
    const { genero_ids = [] } = req.body;
    await Prod08CategoriaGenero.destroy({ where: { RELA_PROD01: req.params.id } });
    if (genero_ids.length > 0) {
      await Prod08CategoriaGenero.bulkCreate(
        genero_ids.map((gid, i) => ({
          RELA_PROD01:  Number(req.params.id),
          RELA_PROD02:  gid,
          PROD08_ORDEN: i * 10,
        }))
      );
    }
    return res.json({ ok: true, mensaje: "Géneros actualizados", data: null });
  } catch (err) { next(err); }
});

// =============================================================
// GÉNEROS  [GET público]
// GET    /catalogos/generos
// GET    /catalogos/generos/paginado
// GET    /catalogos/generos/:id
// POST   /catalogos/generos           [ADMIN]
// PUT    /catalogos/generos/:id       [ADMIN]
// DELETE /catalogos/generos/:id       [ADMIN]
// PUT    /catalogos/generos/:id/reactivar [ADMIN]
// =============================================================

const GENEROS_CONFIG = {
  model:           Prod02Genero,
  nombre:          "géneros",
  where:           { PROD02_FECHABAJA: null },
  attributes:      ["ID_PROD02", "PROD02_NOMBRE", "PROD02_SLUG"],
  order:           [["PROD02_NOMBRE", "ASC"]],
  campoBusqueda:   "PROD02_NOMBRE",
  campoFechaBaja:  "PROD02_FECHABAJA",
  allowHardDelete: false,
  createFields:    ["PROD02_NOMBRE", "PROD02_SLUG", "PROD02_FECHAALTA"],
  updateFields:    ["PROD02_NOMBRE", "PROD02_SLUG"],
};

catalogosRouter.get(   "/generos",               crearListController(GENEROS_CONFIG));
catalogosRouter.get(   "/generos/paginado",      crearListPaginadoController(GENEROS_CONFIG));
catalogosRouter.get(   "/generos/:id",           crearGetByIdController(GENEROS_CONFIG));
catalogosRouter.post(  "/generos",               requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(GENEROS_CONFIG));
catalogosRouter.put(   "/generos/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(GENEROS_CONFIG));
catalogosRouter.delete("/generos/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(GENEROS_CONFIG));
catalogosRouter.put(   "/generos/:id/reactivar", requireAuth, requireNivel(NIVELES.ADMIN), crearReactivarController(GENEROS_CONFIG));

// =============================================================
// TALLES  [GET público]
// GET    /catalogos/talles
// GET    /catalogos/talles/paginado
// GET    /catalogos/talles/:id
// POST   /catalogos/talles            [ADMIN]
// PUT    /catalogos/talles/:id        [ADMIN]
// DELETE /catalogos/talles/:id        [ADMIN]
// PUT    /catalogos/talles/:id/reactivar [ADMIN]
// =============================================================

const TALLES_CONFIG = {
  model:           Prod04Talle,
  nombre:          "talles",
  where:           { PROD04_FECHABAJA: null },
  attributes:      ["ID_PROD04", "PROD04_NOMBRE", "PROD04_ORDEN"],
  order:           [["PROD04_ORDEN", "ASC"]],
  campoBusqueda:   "PROD04_NOMBRE",
  campoFechaBaja:  "PROD04_FECHABAJA",
  allowHardDelete: false,
  createFields:    ["PROD04_NOMBRE", "PROD04_ORDEN", "PROD04_FECHAALTA"],
  updateFields:    ["PROD04_NOMBRE", "PROD04_ORDEN"],
};

catalogosRouter.get(   "/talles",               crearListController(TALLES_CONFIG));
catalogosRouter.get(   "/talles/paginado",      crearListPaginadoController(TALLES_CONFIG));
catalogosRouter.get(   "/talles/:id",           crearGetByIdController(TALLES_CONFIG));
catalogosRouter.post(  "/talles",               requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(TALLES_CONFIG));
catalogosRouter.put(   "/talles/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(TALLES_CONFIG));
catalogosRouter.delete("/talles/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(TALLES_CONFIG));
catalogosRouter.put(   "/talles/:id/reactivar", requireAuth, requireNivel(NIVELES.ADMIN), crearReactivarController(TALLES_CONFIG));

// =============================================================
// COLORES  [GET público — el formulario de producto los usa sin login]
// GET    /catalogos/colores
// GET    /catalogos/colores/paginado
// GET    /catalogos/colores/:id
// POST   /catalogos/colores           [ADMIN]
// PUT    /catalogos/colores/:id       [ADMIN]
// DELETE /catalogos/colores/:id       [ADMIN]
// PUT    /catalogos/colores/:id/reactivar [ADMIN]
// =============================================================

const COLORES_CONFIG = {
  model:           Prod06Color,
  nombre:          "colores",
  where:           { PROD06_FECHABAJA: null },
  attributes:      ["ID_PROD06", "PROD06_NOMBRE", "PROD06_HEX", "PROD06_ORDEN"],
  order:           [["PROD06_ORDEN", "ASC"], ["PROD06_NOMBRE", "ASC"]],
  campoBusqueda:   "PROD06_NOMBRE",
  campoFechaBaja:  "PROD06_FECHABAJA",
  allowHardDelete: false,
  createFields:    ["PROD06_NOMBRE", "PROD06_HEX", "PROD06_ORDEN", "PROD06_FECHAALTA"],
  updateFields:    ["PROD06_NOMBRE", "PROD06_HEX", "PROD06_ORDEN"],
};

catalogosRouter.get(   "/colores",               crearListController(COLORES_CONFIG));
catalogosRouter.get(   "/colores/paginado",      crearListPaginadoController(COLORES_CONFIG));
catalogosRouter.get(   "/colores/:id",           crearGetByIdController(COLORES_CONFIG));
catalogosRouter.post(  "/colores",               requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(COLORES_CONFIG));
catalogosRouter.put(   "/colores/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(COLORES_CONFIG));
catalogosRouter.delete("/colores/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(COLORES_CONFIG));
catalogosRouter.put(   "/colores/:id/reactivar", requireAuth, requireNivel(NIVELES.ADMIN), crearReactivarController(COLORES_CONFIG));

// =============================================================
// ESTADOS DE ORDEN  [auth requerido]
// GET    /catalogos/estados-orden
// GET    /catalogos/estados-orden/:id
// POST   /catalogos/estados-orden     [ADMIN]
// PUT    /catalogos/estados-orden/:id [ADMIN]
// =============================================================

const ESTADOS_ORDEN_CONFIG = {
  model:       Ord01Estado,
  nombre:      "estados de orden",
  attributes:  ["ID_ORD01", "ORD01_CODIGO", "ORD01_ETIQUETA"],
  order:       [["ID_ORD01", "ASC"]],
  createFields:["ORD01_CODIGO", "ORD01_ETIQUETA", "ORD01_FECHAALTA"],
  updateFields:["ORD01_ETIQUETA"],
};

catalogosRouter.get(  "/estados-orden",      requireAuth, requireNivel(NIVELES.ADMIN), crearListController(ESTADOS_ORDEN_CONFIG));
catalogosRouter.get(  "/estados-orden/:id",  requireAuth, requireNivel(NIVELES.ADMIN), crearGetByIdController(ESTADOS_ORDEN_CONFIG));
catalogosRouter.post( "/estados-orden",      requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(ESTADOS_ORDEN_CONFIG));
catalogosRouter.put(  "/estados-orden/:id",  requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(ESTADOS_ORDEN_CONFIG));

// =============================================================
// CONDICIONES IVA  [auth requerido — se usa en checkout]
// GET    /catalogos/condiciones-iva
// GET    /catalogos/condiciones-iva/:id
// =============================================================

const CONDICION_IVA_CONFIG = {
  model:      Ord02CondicionIva,
  nombre:     "condiciones IVA",
  attributes: ["ID_ORD02", "ORD02_CODIGO", "ORD02_NOMBRE"],
  order:      [["ORD02_NOMBRE", "ASC"]],
};

catalogosRouter.get("/condiciones-iva",     requireAuth, requireNivel(NIVELES.ADMIN), crearListController(CONDICION_IVA_CONFIG));
catalogosRouter.get("/condiciones-iva/:id", requireAuth, requireNivel(NIVELES.ADMIN), crearGetByIdController(CONDICION_IVA_CONFIG));

// =============================================================
// TIPOS DE COMPROBANTE AFIP  [auth requerido]
// GET    /catalogos/tipos-comprobante
// GET    /catalogos/tipos-comprobante/:id
// =============================================================

const TIPO_COMP_CONFIG = {
  model:      Fact01TipoComp,
  nombre:     "tipos de comprobante",
  attributes: ["ID_FACT01", "FACT01_LETRA", "FACT01_NOMBRE", "FACT01_CONDICION_RECEPTOR"],
  order:      [["FACT01_LETRA", "ASC"]],
};

catalogosRouter.get("/tipos-comprobante",     requireAuth, requireNivel(NIVELES.ADMIN), crearListController(TIPO_COMP_CONFIG));
catalogosRouter.get("/tipos-comprobante/:id", requireAuth, requireNivel(NIVELES.ADMIN), crearGetByIdController(TIPO_COMP_CONFIG));

// =============================================================
// PUNTOS DE VENTA  [solo admin]
// GET    /catalogos/puntos-venta
// GET    /catalogos/puntos-venta/paginado
// GET    /catalogos/puntos-venta/:id
// POST   /catalogos/puntos-venta      [ADMIN]
// PUT    /catalogos/puntos-venta/:id  [ADMIN]
// DELETE /catalogos/puntos-venta/:id  [ADMIN]
// =============================================================

const PUNTO_VENTA_CONFIG = {
  model:           Fact02PuntoVenta,
  nombre:          "puntos de venta",
  where:           { FACT02_ACTIVO: true },
  attributes:      ["ID_FACT02", "FACT02_NUMERO", "FACT02_NOMBRE", "FACT02_ACTIVO"],
  order:           [["FACT02_NUMERO", "ASC"]],
  allowHardDelete: false,
  createFields:    ["FACT02_NUMERO", "FACT02_NOMBRE", "FACT02_ACTIVO", "FACT02_FECHAALTA"],
  updateFields:    ["FACT02_NOMBRE", "FACT02_ACTIVO"],
};

catalogosRouter.get(   "/puntos-venta",          requireAuth, requireNivel(NIVELES.ADMIN), crearListController(PUNTO_VENTA_CONFIG));
catalogosRouter.get(   "/puntos-venta/paginado", requireAuth, requireNivel(NIVELES.ADMIN), crearListPaginadoController(PUNTO_VENTA_CONFIG));
catalogosRouter.get(   "/puntos-venta/:id",      requireAuth, requireNivel(NIVELES.ADMIN), crearGetByIdController(PUNTO_VENTA_CONFIG));
catalogosRouter.post(  "/puntos-venta",          requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(PUNTO_VENTA_CONFIG));
catalogosRouter.put(   "/puntos-venta/:id",      requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(PUNTO_VENTA_CONFIG));
catalogosRouter.delete("/puntos-venta/:id",      requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(PUNTO_VENTA_CONFIG));

// =============================================================
// OPCIONES DE ENVÍO  [GET autenticado — se elige en checkout]
// GET    /catalogos/opciones-envio
// GET    /catalogos/opciones-envio/:id
// POST   /catalogos/opciones-envio    [ADMIN]
// PUT    /catalogos/opciones-envio/:id [ADMIN]
// DELETE /catalogos/opciones-envio/:id [ADMIN]
// PUT    /catalogos/opciones-envio/:id/reactivar [ADMIN]
// =============================================================

const OPCIONES_ENVIO_CONFIG = {
  model:           Envio01Opcion,
  nombre:          "opciones de envío",
  where:           { ENVIO01_ACTIVO: true, ENVIO01_FECHABAJA: null },
  attributes:      [
    "ID_ENVIO01",
    "ENVIO01_NOMBRE",
    "ENVIO01_DESCRIPCION",
    "ENVIO01_PRECIO",
    "ENVIO01_TIEMPO_ESTIMADO",
    "ENVIO01_GRATIS_DESDE",
  ],
  order:           [["ENVIO01_PRECIO", "ASC"]],
  campoFechaBaja:  "ENVIO01_FECHABAJA",
  allowHardDelete: false,
  createFields:    [
    "ENVIO01_NOMBRE",
    "ENVIO01_DESCRIPCION",
    "ENVIO01_PRECIO",
    "ENVIO01_TIEMPO_ESTIMADO",
    "ENVIO01_GRATIS_DESDE",
    "ENVIO01_ACTIVO",
    "ENVIO01_FECHAALTA",
  ],
  updateFields:    [
    "ENVIO01_NOMBRE",
    "ENVIO01_DESCRIPCION",
    "ENVIO01_PRECIO",
    "ENVIO01_TIEMPO_ESTIMADO",
    "ENVIO01_GRATIS_DESDE",
    "ENVIO01_ACTIVO",
  ],
};

catalogosRouter.get(   "/opciones-envio",               requireAuth, requireNivel(NIVELES.ADMIN), crearListController(OPCIONES_ENVIO_CONFIG));
catalogosRouter.get(   "/opciones-envio/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearGetByIdController(OPCIONES_ENVIO_CONFIG));
catalogosRouter.post(  "/opciones-envio",               requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(OPCIONES_ENVIO_CONFIG));
catalogosRouter.put(   "/opciones-envio/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(OPCIONES_ENVIO_CONFIG));
catalogosRouter.delete("/opciones-envio/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(OPCIONES_ENVIO_CONFIG));
catalogosRouter.put(   "/opciones-envio/:id/reactivar", requireAuth, requireNivel(NIVELES.ADMIN), crearReactivarController(OPCIONES_ENVIO_CONFIG));

// =============================================================
// MARCAS  [GET público — el catálogo las necesita sin login]
// GET    /catalogos/marcas
// GET    /catalogos/marcas/paginado
// GET    /catalogos/marcas/:id
// POST   /catalogos/marcas             [ADMIN]
// PUT    /catalogos/marcas/:id         [ADMIN]
// DELETE /catalogos/marcas/:id         [ADMIN]
// PUT    /catalogos/marcas/:id/reactivar [ADMIN]
// =============================================================

const MARCAS_CONFIG = {
  model:           Prod07Marca,
  nombre:          "marcas",
  where:           { PROD07_FECHABAJA: null },
  attributes:      ["ID_PROD07", "PROD07_NOMBRE", "PROD07_SLUG", "PROD07_LOGO", "PROD07_DESCRIPCION", "PROD07_ORDEN", "PROD07_ACTIVO"],
  order:           [["PROD07_ORDEN", "ASC"], ["PROD07_NOMBRE", "ASC"]],
  campoBusqueda:   "PROD07_NOMBRE",
  campoFechaBaja:  "PROD07_FECHABAJA",
  allowHardDelete: false,
  createFields:    ["PROD07_NOMBRE", "PROD07_SLUG", "PROD07_LOGO", "PROD07_DESCRIPCION", "PROD07_ORDEN", "PROD07_ACTIVO", "PROD07_FECHAALTA"],
  updateFields:    ["PROD07_NOMBRE", "PROD07_SLUG", "PROD07_LOGO", "PROD07_DESCRIPCION", "PROD07_ORDEN", "PROD07_ACTIVO"],
};

catalogosRouter.get(   "/marcas",               crearListController(MARCAS_CONFIG));
catalogosRouter.get(   "/marcas/paginado",      crearListPaginadoController(MARCAS_CONFIG));
catalogosRouter.get(   "/marcas/:id",           crearGetByIdController(MARCAS_CONFIG));
catalogosRouter.post(  "/marcas",               requireAuth, requireNivel(NIVELES.ADMIN), crearCreateController(MARCAS_CONFIG));
catalogosRouter.put(   "/marcas/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearUpdateController(MARCAS_CONFIG));
catalogosRouter.delete("/marcas/:id",           requireAuth, requireNivel(NIVELES.ADMIN), crearSoftDeleteController(MARCAS_CONFIG));
catalogosRouter.put(   "/marcas/:id/reactivar", requireAuth, requireNivel(NIVELES.ADMIN), crearReactivarController(MARCAS_CONFIG));
