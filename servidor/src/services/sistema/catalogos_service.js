import {
  TipoDocumento,
  Sexo,
  TipoPersona,
  PlanTipo,
  CategoriaProducto,
  Patologia,
  Ejercicio,
  TipoEjercicio,
  GrupoMuscular,
} from "../../models/index.js";

export async function obtenerCatalogos() {
  const [tiposDocumento, sexos, tiposPersona, tiposPlan, categoriasProducto, patologias, ejerciciosKinesiologia] = await Promise.all([
    TipoDocumento.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    Sexo.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    TipoPersona.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    PlanTipo.findAll({
      attributes: ["id", "descripcion", "dias_totales", "ingresos", "precio"],
      where: { activo: true },
      order: [["descripcion", "ASC"]],
    }),
    CategoriaProducto.findAll({
      attributes: ["id", "descripcion"],
      where: { activo: true },
      order: [["descripcion", "ASC"]],
    }),
    Patologia.findAll({
      attributes: ["id", "descripcion"],
      where: { activo: true },
      order: [["descripcion", "ASC"]],
    }),
    Ejercicio.findAll({
      attributes: ["id", "nombre"],
      where: { activo: true },
      include: [
        { model: TipoEjercicio, as: "tipo_ejercicio", attributes: ["descripcion"], where: { descripcion: "Kinesiología" } },
        { model: GrupoMuscular, as: "grupo_muscular", attributes: ["descripcion", "zona"] },
      ],
      order: [["nombre", "ASC"]],
    }),
  ]);

  return {
    tiposDocumento: tiposDocumento.map((x) => ({ value: x.id, label: x.descripcion })),
    sexos:          sexos.map((x) => ({ value: x.id, label: x.descripcion })),
    tiposPersona:   tiposPersona.map((x) => ({ value: x.id, label: x.descripcion })),
    tiposPlan:      tiposPlan.map((x) => ({
      value:       x.id,
      label:       x.descripcion,
      dias_totales: x.dias_totales,
      ingresos:    x.ingresos,
      precio:      Number(x.precio),
    })),
    categoriasProducto: categoriasProducto.map((x) => ({ value: x.id, label: x.descripcion })),
    patologias:      patologias.map((x) => ({ value: x.id, label: x.descripcion })),
    ejerciciosKinesiologia: ejerciciosKinesiologia.map((x) => ({
      value: x.id,
      label: x.nombre,
      grupo_muscular: x.grupo_muscular?.descripcion ?? null,
      zona:           x.grupo_muscular?.zona ?? "Otros",
    })),
  };
}
