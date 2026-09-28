import { once } from "node:events";
import { DatosInvalidos } from "../../../nucleo/errores.js";
import * as importacion from "./importacion_servicio.js";

// Los campos de texto de un formulario multipart llegan como string JSON.
function campoJson(req, nombre) {
  try {
    const valor = JSON.parse(req.body?.[nombre] || "{}");
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error();
    return valor;
  } catch {
    throw new DatosInvalidos(`El campo "${nombre}" es inválido.`);
  }
}

function archivo(req) {
  if (!req.file) throw new DatosInvalidos("Elegí un archivo .xlsx o .csv.");
  return req.file;
}

export async function previsualizar(req, res) {
  const { buffer, originalname } = archivo(req);
  res.json({ ok: true, data: await importacion.previsualizar(buffer, originalname, campoJson(req, "opciones")) });
}

export async function validar(req, res) {
  const { buffer, originalname } = archivo(req);
  const data = await importacion.validar({
    buffer,
    nombreArchivo: originalname,
    mapeo: campoJson(req, "mapeo"),
    opciones: campoJson(req, "opciones"),
    id: req.body?.id,
    usuario_id: req.usuario.id,
  });
  res.json({ ok: true, data });
}

export async function obtener(req, res) {
  res.json({ ok: true, data: await importacion.obtener(req.datos.params.id, req.usuario.id) });
}

export async function historial(req, res) {
  res.json({ ok: true, data: await importacion.historial(req.usuario.id) });
}

export async function ejecutarLote(req, res) {
  res.json({ ok: true, data: await importacion.ejecutarLote(req.datos.params.id, req.usuario.id, req.datos.body) });
}

export async function cancelar(req, res) {
  res.json({ ok: true, data: await importacion.cancelar(req.datos.params.id, req.usuario.id) });
}

export async function informe(req, res) {
  await importacion.obtener(req.datos.params.id, req.usuario.id); // 404 antes de empezar a escribir
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="importacion-${req.datos.params.id}.csv"`);
  // Excepción a "sin try/catch": con la respuesta ya empezada, el manejador central
  // no puede responder JSON; solo queda cortar la conexión.
  try {
    for await (const parte of importacion.informe(req.datos.params.id, req.usuario.id)) {
      if (res.destroyed) break;
      if (!res.write(parte)) await once(res, "drain");
    }
    res.end();
  } catch (error) {
    console.error("Error generando el informe de importación:", error.message);
    res.destroy();
  }
}

export async function plantilla(_req, res) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="plantilla-catalogo.xlsx"');
  await importacion.escribirPlantilla(res);
  res.end();
}
