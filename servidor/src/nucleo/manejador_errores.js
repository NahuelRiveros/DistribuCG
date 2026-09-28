import { ErrorApp } from "./errores.js";

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ ok: false, codigo: "RUTA_NO_ENCONTRADA", mensaje: "La ruta no existe.", detalles: [] });
}

// Express 5 envía acá cualquier error, también los de funciones async.
// Nunca se devuelve el stack ni el mensaje crudo de la base al cliente.
export function manejadorErrores(err, req, res, _next) {
  if (err instanceof ErrorApp) {
    return responder(res, err.status, err.codigo, err.message, err.detalles);
  }
  if (err?.type === "entity.parse.failed") {
    return responder(res, 400, "JSON_INVALIDO", "El cuerpo de la solicitud no es un JSON válido.");
  }
  if (err?.type === "entity.too.large") {
    return responder(res, 413, "DEMASIADO_GRANDE", "La solicitud es demasiado grande.");
  }
  if (err?.name === "SequelizeUniqueConstraintError") {
    const detalles = (err.errors ?? []).map((e) => ({ campo: e.path, mensaje: "Ya existe un registro con este valor." }));
    return responder(res, 409, "DUPLICADO", "Ya existe un registro con esos datos.", detalles);
  }
  if (err?.name === "SequelizeForeignKeyConstraintError") {
    return responder(res, 409, "EN_USO", "No se puede completar: el registro está relacionado con otros datos.");
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return responder(res, 500, "ERROR_INTERNO", "Ocurrió un error inesperado. Intentá de nuevo en unos minutos.");
}

function responder(res, status, codigo, mensaje, detalles = []) {
  return res.status(status).json({ ok: false, codigo, mensaje, detalles });
}
