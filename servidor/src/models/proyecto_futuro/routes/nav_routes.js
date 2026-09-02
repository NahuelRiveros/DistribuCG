import { Router }               from "express";
import { Op }                   from "sequelize";
import { Prod02Genero }          from "../models/index.js";
import { Prod01Categoria }       from "../models/index.js";
import { Prod08CategoriaGenero } from "../models/index.js";

export const navRouter = Router();

// GET /api/nav/menu
// Devuelve géneros → categorías raíz → subcategorías de ese género.
// Las subcategorías son filtradas por género: "Pantalones" en Mujer muestra
// solo las subcats asignadas a Mujer; en Hombre muestra solo las de Hombre.
// Ruta pública (sin auth — la usa el frontend antes del login)
navRouter.get("/menu", async (_req, res, next) => {
  try {
    // Query 1: géneros con sus categorías raíz (via PROD_08)
    const generos = await Prod02Genero.findAll({
      where:      { PROD02_FECHABAJA: null },
      attributes: ["ID_PROD02", "PROD02_NOMBRE", "PROD02_SLUG"],
      order:      [["PROD02_NOMBRE", "ASC"]],
      include: [{
        model:      Prod01Categoria,
        as:         "categorias",
        where:      { PROD01_FECHABAJA: null, RELA_PARENT: null },
        required:   false,
        attributes: ["ID_PROD01", "PROD01_NOMBRE", "PROD01_SLUG"],
        through:    { attributes: ["PROD08_ORDEN"] },
      }],
    });

    // Query 2: todas las subcategorías activas
    const todasSubs = await Prod01Categoria.findAll({
      where:      { PROD01_FECHABAJA: null, RELA_PARENT: { [Op.ne]: null } },
      attributes: ["ID_PROD01", "PROD01_NOMBRE", "PROD01_SLUG", "RELA_PARENT"],
    });

    // Query 3: asignaciones género → subcategoría (solo para subcats activas)
    const subIds = todasSubs.map((s) => s.ID_PROD01);
    const subLinks = subIds.length > 0
      ? await Prod08CategoriaGenero.findAll({
          where:      { RELA_PROD01: { [Op.in]: subIds } },
          attributes: ["RELA_PROD01", "RELA_PROD02"],
        })
      : [];

    // Índice rápido: catId → subcat
    const subById = Object.fromEntries(todasSubs.map((s) => [s.ID_PROD01, s]));

    // Mapa: subcatMap[generoId][parentId] = [{ id, nombre, slug }]
    const subcatMap = {};
    for (const link of subLinks) {
      const sub = subById[link.RELA_PROD01];
      if (!sub) continue;
      const gid      = link.RELA_PROD02;
      const parentId = sub.RELA_PARENT;
      if (!subcatMap[gid])           subcatMap[gid] = {};
      if (!subcatMap[gid][parentId]) subcatMap[gid][parentId] = [];
      subcatMap[gid][parentId].push({
        id:     sub.ID_PROD01,
        nombre: sub.PROD01_NOMBRE,
        slug:   sub.PROD01_SLUG,
      });
    }

    // Armar respuesta final
    const menu = generos.map((g) => ({
      id:     g.ID_PROD02,
      nombre: g.PROD02_NOMBRE,
      slug:   g.PROD02_SLUG,
      categorias: (g.categorias ?? [])
        .slice()
        .sort((a, b) => {
          const oa = a.Prod08CategoriaGenero?.PROD08_ORDEN ?? 0;
          const ob = b.Prod08CategoriaGenero?.PROD08_ORDEN ?? 0;
          return oa !== ob ? oa - ob : a.PROD01_NOMBRE.localeCompare(b.PROD01_NOMBRE);
        })
        .map((c) => ({
          id:     c.ID_PROD01,
          nombre: c.PROD01_NOMBRE,
          slug:   c.PROD01_SLUG,
          subcategorias: (subcatMap[g.ID_PROD02]?.[c.ID_PROD01] ?? [])
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        })),
    }));

    return res.json({ ok: true, mensaje: "Menú de navegación", data: menu });
  } catch (error) {
    next(error);
  }
});
