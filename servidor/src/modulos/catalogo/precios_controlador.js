import { ajustarPrecios } from "./precios_servicio.js";

export async function ajustar(req, res) {
  const data = await ajustarPrecios(req.datos.body);
  res.json({ ok: true, data });
}
