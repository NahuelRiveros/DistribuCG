import { DatosInvalidos } from "./errores.js";

/**
 * Middleware que valida body, query y params con schemas Zod.
 * El controlador recibe los datos limpios en req.datos.body / .query / .params
 * (req.query es de solo lectura en Express 5, por eso no se pisa).
 *
 *   router.post("/", validar({ body: productoSchema }), crearProducto)
 */
export function validar(schemas) {
  return (req, _res, next) => {
    const datos = {};
    const detalles = [];

    for (const parte of ["params", "query", "body"]) {
      const schema = schemas[parte];
      if (!schema) continue;
      const resultado = schema.safeParse(req[parte] ?? {});
      if (resultado.success) {
        datos[parte] = resultado.data;
      } else {
        for (const issue of resultado.error.issues) {
          detalles.push({ campo: issue.path.join(".") || parte, mensaje: issue.message });
        }
      }
    }

    if (detalles.length > 0) throw new DatosInvalidos("Revisá los datos ingresados.", detalles);
    req.datos = datos;
    next();
  };
}
