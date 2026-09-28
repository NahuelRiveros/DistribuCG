import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Pencil, Percent, Plus, Trash2 } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import { tieneRol } from "compartido/reglas/roles.js";
import { mensajeDeError } from "@/api/http.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import SearchField from "@/componentes/ui/search_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import ConfirmDialog from "@/componentes/ui/confirm_dialog.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import CategoriaSelect from "../componentes/categoria_select.jsx";
import AjustePreciosModal from "./ajuste_precios_modal.jsx";
import { useCambiarEstadoProducto, useCategorias, useEliminarProducto, useProductos } from "../hooks/use_catalogo.js";
import { precioVisible } from "../utils/precios.js";

const ESTADOS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "activos", etiqueta: "Activos" },
  { valor: "inactivos", etiqueta: "Inactivos" },
  { valor: "sin_publicar", etiqueta: "Sin publicar" },
];
const { etiqueta_variantes } = proyecto.catalogo;

function rangoPrecios(variantes) {
  const precios = variantes.map((v) => precioVisible(v.precio, v.iva_porcentaje));
  if (precios.length === 0) return "—";
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  return min === max ? formatearDinero(min) : `${formatearDinero(min)} – ${formatearDinero(max)}`;
}

export default function ProductosPage() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    q: params.get("q") ?? "",
    categoria: params.get("categoria") ?? "",
    estado: params.get("estado") ?? "todos",
    pagina: Number(params.get("pagina") ?? 1),
    limite: 20,
  };
  const { usuario } = useAuth();
  const toast = useToast();
  const categorias = useCategorias();
  const productos = useProductos(filtros);
  const cambiarEstado = useCambiarEstadoProducto();
  const eliminar = useEliminarProducto();
  const [aEliminar, setAEliminar] = useState(null);
  const [ajustando, setAjustando] = useState(false);

  // Los filtros viven en la URL: se pueden compartir y sobreviven a recargar la página.
  const actualizarFiltro = useCallback(
    (clave, valor) =>
      setParams((actuales) => {
        const nuevos = new URLSearchParams(actuales);
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
        if (clave !== "pagina") nuevos.delete("pagina");
        return nuevos;
      }),
    [setParams],
  );
  const buscar = useCallback((texto) => actualizarFiltro("q", texto), [actualizarFiltro]);

  async function alternarPublicado(producto) {
    try {
      await cambiarEstado.mutateAsync({ id: producto.id, publicado: !producto.publicado });
      toast.exito(producto.publicado ? "El producto ya no se ve en la tienda" : "Producto publicado");
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  async function confirmarEliminar() {
    try {
      await eliminar.mutateAsync(aEliminar.id);
      toast.exito("Producto eliminado");
      setAEliminar(null);
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titulos text-2xl font-bold">Productos</h1>
          <p className="text-sm text-texto-suave">Cargá, editá y publicá los productos de la tienda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => setAjustando(true)}>
            <Percent className="h-4 w-4" aria-hidden="true" /> Ajustar precios
          </Boton>
          <Boton a="/admin/catalogo/productos/nuevo">
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo producto
          </Boton>
        </div>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1.5fr_1fr]">
        <SearchField valor={filtros.q} onBuscar={buscar} etiqueta="Buscar productos" placeholder="Nombre, marca o código" />
        <CategoriaSelect
          name="filtro_categoria"
          aria-label="Filtrar por categoría"
          categorias={categorias.data}
          placeholder="Todas las categorías"
          value={filtros.categoria}
          onChange={(e) => actualizarFiltro("categoria", e.target.value)}
          className="mt-0"
        />
        <SelectField
          name="filtro_estado"
          aria-label="Filtrar por estado"
          opciones={ESTADOS}
          value={filtros.estado}
          onChange={(e) => actualizarFiltro("estado", e.target.value === "todos" ? "" : e.target.value)}
          className="mt-0"
        />
      </div>

      <div className="mt-6">
        {productos.isPending ? (
          <Cargando texto="Cargando productos..." />
        ) : productos.isError ? (
          <ErrorCarga error={productos.error} onReintentar={productos.refetch} />
        ) : productos.data.productos.length === 0 ? (
          <Vacio
            titulo="No hay productos para mostrar"
            texto={filtros.q || filtros.categoria || filtros.estado !== "todos" ? "Probá con otros filtros." : "Cargá tu primer producto para empezar."}
          />
        ) : (
          <>
            <Tabla
              etiqueta="Productos"
              filas={productos.data.productos}
              columnas={[
                {
                  titulo: "Producto",
                  principal: true,
                  celda: (p) => (
                    <>
                      <p className="font-semibold">{p.nombre}</p>
                      {p.marca && <p className="text-xs text-texto-suave">{p.marca}</p>}
                    </>
                  ),
                },
                { titulo: "Categoría", celda: (p) => p.categoria?.nombre, className: "text-texto-suave" },
                { titulo: etiqueta_variantes, celda: (p) => p.variantes.length },
                { titulo: "Precio", celda: (p) => rangoPrecios(p.variantes), className: "whitespace-nowrap" },
                {
                  titulo: "Estado",
                  celda: (p) => (
                    <span className="flex flex-wrap gap-1">
                      {!p.activo && <Insignia tono="peligro">Inactivo</Insignia>}
                      {p.publicado ? <Insignia tono="exito">Publicado</Insignia> : <Insignia tono="aviso">Sin publicar</Insignia>}
                    </span>
                  ),
                },
              ]}
              acciones={(p, { enTarjeta }) => (
                <>
                  <Boton variante="fantasma" tamano={enTarjeta ? "chico" : "icono"} a={`/admin/catalogo/productos/${p.id}`} aria-label={`Editar ${p.nombre}`} title="Editar">
                    <Pencil className="h-4 w-4" aria-hidden="true" /> {enTarjeta && "Editar"}
                  </Boton>
                  <Boton
                    variante="fantasma"
                    tamano={enTarjeta ? "chico" : "icono"}
                    onClick={() => alternarPublicado(p)}
                    disabled={cambiarEstado.isPending}
                    aria-label={p.publicado ? `Ocultar ${p.nombre} de la tienda` : `Publicar ${p.nombre}`}
                    title={p.publicado ? "Ocultar de la tienda" : "Publicar"}
                  >
                    {p.publicado ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    {enTarjeta && (p.publicado ? "Ocultar" : "Publicar")}
                  </Boton>
                  {tieneRol(usuario, ["admin"]) && (
                    <Boton
                      variante="fantasma"
                      tamano={enTarjeta ? "chico" : "icono"}
                      onClick={() => setAEliminar(p)}
                      aria-label={`Eliminar ${p.nombre}`}
                      title="Eliminar"
                      className="text-peligro"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> {enTarjeta && "Eliminar"}
                    </Boton>
                  )}
                </>
              )}
            />
            <Paginacion
              paginacion={productos.data.paginacion}
              onCambiar={(pagina) => actualizarFiltro("pagina", String(pagina))}
              deshabilitado={productos.isFetching}
            />
          </>
        )}
      </div>

      {ajustando && <AjustePreciosModal categorias={categorias.data ?? []} onCerrar={() => setAjustando(false)} />}
      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Eliminar producto"
        mensaje={`"${aEliminar?.nombre}" deja de verse en la tienda y en el panel. Los pedidos ya hechos no cambian.`}
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setAEliminar(null)}
      />
    </div>
  );
}
