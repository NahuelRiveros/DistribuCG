import { FolderTree, Package, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategorias, useProductos } from "../hooks/use_catalogo.js";

function Tarjeta({ icono: Icono, titulo, valor, a }) {
  return (
    <Link to={a} className="flex items-center gap-4 rounded-2xl border border-borde bg-superficie p-5 transition hover:border-primario">
      <span className="rounded-xl bg-primario/10 p-3 text-primario">
        <Icono className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-bold">{valor ?? "—"}</span>
        <span className="text-sm text-texto-suave">{titulo}</span>
      </span>
    </Link>
  );
}

/** Tarjetas del catálogo para el inicio del panel. */
export default function ResumenCatalogo() {
  const todos = useProductos({ limite: 1 });
  const sinPublicar = useProductos({ limite: 1, estado: "sin_publicar" });
  const categorias = useCategorias();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tarjeta icono={Package} titulo="Productos" valor={todos.data?.paginacion.total} a="/admin/catalogo/productos" />
      <Tarjeta icono={EyeOff} titulo="Sin publicar" valor={sinPublicar.data?.paginacion.total} a="/admin/catalogo/productos?estado=sin_publicar" />
      <Tarjeta icono={FolderTree} titulo="Categorías" valor={categorias.data?.length} a="/admin/catalogo/categorias" />
    </div>
  );
}
