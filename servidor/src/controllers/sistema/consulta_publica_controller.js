import { consultarPlanPorDni } from "../../services/sistema/consulta_publica_service.js";

export async function consultarPlanController(req, res, next) {
  try {
    const { dni } = req.params;

    if (!dni || String(dni).trim() === "") {
      return res.status(400).json({
        ok:      false,
        codigo:  "VALIDACION",
        mensaje: "El DNI es requerido",
      });
    }

    const resultado = await consultarPlanPorDni(dni);

    if (!resultado.ok) {
      const status = resultado.codigo === "NO_EXISTE" ? 404 : 400;
      return res.status(status).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}
