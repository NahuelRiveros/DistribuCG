import {
  TipoDocumento,
  Sexo,
  TipoPersona,
  PlanTipo,
  CategoriaProducto,
  Patologia,
} from "../../models/index.js";
import { listarOpciones } from "../common/select_options.js";

export async function obtenerCatalogos() {
  const [tiposDocumento, sexos, tiposPersona, tiposPlan, categoriasProducto, patologias] = await Promise.all([
    listarOpciones(TipoDocumento),
    listarOpciones(Sexo),
    listarOpciones(TipoPersona),
    listarOpciones(PlanTipo, { where: { activo: true }, extra: ["dias_totales", "ingresos", "precio"] }),
    listarOpciones(CategoriaProducto, { where: { activo: true } }),
    listarOpciones(Patologia, { where: { activo: true } }),
  ]);

  return {
    tiposDocumento,
    sexos,
    tiposPersona,
    tiposPlan: tiposPlan.map((x) => ({ ...x, precio: Number(x.precio) })),
    categoriasProducto,
    patologias,
  };
}
