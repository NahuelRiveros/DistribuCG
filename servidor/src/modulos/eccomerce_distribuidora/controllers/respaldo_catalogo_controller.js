import { filasRespaldo, armarCsvRespaldo } from "../services/respaldo_catalogo_service.js";
import { hoyArgentina } from "../services/importacion/lista_cliente.js";
import { tienePermiso } from "../../../../../core/permisos_config.js";

/** CAT-65: planilla del catálogo vigente para guardar fuera del sistema. */
export async function respaldoCatalogoController(req, res) {
  try {
    const csv = armarCsvRespaldo(await filasRespaldo(), { conCostos: tienePermiso(req.user, "precios.editar") });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="respaldo-catalogo-${hoyArgentina()}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Respaldo del catálogo:", error.name, error.message);
    return res.status(500).json({ ok: false, mensaje: "No se pudo armar el respaldo del catálogo." });
  }
}
