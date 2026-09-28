import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import { useCategorias, useGuardarProducto, useProducto } from "../hooks/use_catalogo.js";
import ProductoForm from "./producto_form.jsx";
import ImagenesProducto from "./imagenes_producto.jsx";

const LISTADO = "/admin/catalogo/productos";

export default function ProductoFormPage() {
  const { id } = useParams();
  const esNuevo = id === undefined;
  const navigate = useNavigate();
  const toast = useToast();
  const categorias = useCategorias();
  const producto = useProducto(id, { enabled: !esNuevo });
  const guardar = useGuardarProducto();

  async function onGuardar(datos) {
    const guardado = await guardar.mutateAsync(esNuevo ? datos : { ...datos, id: Number(id) });
    if (esNuevo) {
      // Se queda en el producto recién creado para poder cargarle las imágenes.
      toast.exito("Producto creado. Ahora podés agregarle imágenes.");
      navigate(`/admin/catalogo/productos/${guardado.id}`, { replace: true });
    } else {
      toast.exito("Cambios guardados");
      navigate(LISTADO);
    }
  }

  let contenido;
  if (categorias.isPending || (!esNuevo && producto.isPending)) {
    contenido = <Cargando />;
  } else if (categorias.isError || producto.isError) {
    contenido = <ErrorCarga error={categorias.error ?? producto.error} onReintentar={() => (categorias.isError ? categorias.refetch() : producto.refetch())} />;
  } else if (categorias.data.length === 0) {
    contenido = (
      <Vacio
        titulo="Primero creá una categoría"
        texto="Todo producto pertenece a una categoría."
        accion={<Boton a="/admin/catalogo/categorias">Ir a categorías</Boton>}
      />
    );
  } else {
    contenido = (
      <div className="space-y-6">
        {esNuevo ? (
          <p className="rounded-xl bg-fondo p-3 text-sm text-texto-suave">Las imágenes se agregan después de guardar el producto.</p>
        ) : (
          <ImagenesProducto producto={producto.data} />
        )}
        <ProductoForm key={id ?? "nuevo"} producto={esNuevo ? null : producto.data} categorias={categorias.data} onGuardar={onGuardar} onCancelar={() => navigate(LISTADO)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={LISTADO} className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-texto">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Productos
      </Link>
      <h1 className="mb-6 mt-2 font-titulos text-2xl font-bold">{esNuevo ? "Nuevo producto" : `Editar ${producto.data?.nombre ?? "producto"}`}</h1>
      {contenido}
    </div>
  );
}
