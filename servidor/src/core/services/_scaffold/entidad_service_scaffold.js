/**
 * PLANTILLA — service CRUD sobre un modelo con baja lógica. Ver
 * services/productos/catalogos_service.js (funciones de Talle/Color) para
 * un ejemplo real ya funcionando con este mismo patrón.
 *
 * No se importa desde ningún lado (carpeta `_scaffold/`) — punto de partida
 * para copiar, no forma parte del árbol real. Importa el modelo scaffold de
 * al lado para que el ejemplo compile solo, tal cual está.
 *
 * Cómo usarla:
 *   1. Copiá este archivo a `services/<dominio>/mi_entidad_service.js`.
 *   2. Cambiá el import de abajo por tu modelo real (models/index.js) y
 *      reemplazá "Entidad" por su nombre.
 *   3. Ajustá defaultAttributes/defaultOrder y los campos de crear/actualizar.
 *   4. Si necesitás validar unicidad (ej. slug), mirá existeCategoriaConSlug
 *      en catalogos_service.js.
 *
 * `crearCrudService` da listar/obtenerPorId/cambiarEstado/eliminar (hard
 * delete) gratis — a propósito NO da crear/actualizar (ver el comentario en
 * services/common/crud_service.js: casi siempre hay validación de negocio
 * que no vale la pena forzar a un config genérico). La baja lógica
 * (`bajaLogica` acá abajo) tampoco la da el helper — se escribe a mano.
 */

import { Entidad } from "../../models/_scaffold/entidad_model_scaffold.js"; // TODO: from "../../models/index.js"
import { crearCrudService } from "../common/crud_service.js";

async function bajaLogica(Model, id) {
  const item = await Model.findByPk(id);
  if (!item) return null;
  await item.update({ fecha_baja: new Date() });
  return item;
}

const entidadCrud = crearCrudService(Entidad, {
  defaultOrder: [["orden", "ASC"]],
  defaultAttributes: ["id", "nombre", "orden"],
  softDeleteField: "fecha_baja",
});

export async function listarEntidades() {
  const { items } = await entidadCrud.listar();
  return items;
}

export async function crearEntidad({ nombre, orden = 0 }) {
  return Entidad.create({ nombre, orden, fecha_alta: new Date() });
}

export async function actualizarEntidad(id, { nombre, orden = 0 }) {
  const entidad = await Entidad.findByPk(id);
  if (!entidad) return null;
  await entidad.update({ nombre, orden });
  return entidad;
}

export async function eliminarEntidad(id) {
  return bajaLogica(Entidad, id);
}
