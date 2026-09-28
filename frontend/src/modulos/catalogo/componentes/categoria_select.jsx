import SelectField from "@/componentes/ui/select_field.jsx";
import { aplanarConNivel } from "../utils/arbol.js";

/** Select de categorías con sangría por nivel. `excluir` = Set de ids que no se pueden elegir. */
export default function CategoriaSelect({ categorias = [], excluir, ...props }) {
  const opciones = aplanarConNivel(categorias).map((c) => ({
    valor: c.id,
    etiqueta: `${"   ".repeat(c.nivel)}${c.nivel > 0 ? "└ " : ""}${c.nombre}`,
    deshabilitada: excluir?.has(c.id),
  }));
  return <SelectField opciones={opciones} {...props} />;
}
