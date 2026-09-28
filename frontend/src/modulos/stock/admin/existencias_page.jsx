import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History, PackagePlus, Settings2, SlidersHorizontal } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import SearchField from "@/componentes/ui/search_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import CategoriaSelect from "@/modulos/catalogo/componentes/categoria_select.jsx";
import { useCategorias } from "@/modulos/catalogo/hooks/use_catalogo.js";
import { useExistencias } from "../hooks/use_stock.js";
import { ESTADOS_STOCK } from "../utils/presentacion.js";
import AjusteModal from "./ajuste_modal.jsx";
import ConfigurarModal from "./configurar_modal.jsx";

const FILTROS_ESTADO = [
  { valor: "todos", etiqueta: "Todas las presentaciones" },
  { valor: "controlados", etiqueta: "Con control de stock" },
  { valor: "bajo", etiqueta: "Stock bajo" },
  { valor: "sin_stock", etiqueta: "Sin stock" },
  { valor: "sin_control", etiqueta: "Sin control" },
];

const nombreDe = (e) => (e.presentacion ? `${e.producto} · ${e.presentacion}` : e.producto);

export default function ExistenciasPage() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    q: params.get("q") ?? "",
    categoria: params.get("categoria") ?? "",
    estado: params.get("estado") ?? "todos",
    pagina: Number(params.get("pagina") ?? 1),
    limite: 30,
  };
  const categorias = useCategorias();
  const existencias = useExistencias(filtros);
  const [ajustando, setAjustando] = useState(null);
  const [configurando, setConfigurando] = useState(null);

  const actualizar = useCallback(
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
  const buscar = useCallback((texto) => actualizar("q", texto), [actualizar]);

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titulos text-2xl font-bold">Existencias</h1>
          <p className="text-sm text-texto-suave">Cuánto hay de cada presentación. Disponible = cantidad − reservado para pedidos.</p>
        </div>
        <Boton a="/admin/stock/ingreso">
          <PackagePlus className="h-4 w-4" aria-hidden="true" /> Ingreso de mercadería
        </Boton>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1.5fr_1fr]">
        <SearchField valor={filtros.q} onBuscar={buscar} etiqueta="Buscar en existencias" placeholder="Producto, presentación, marca o código" />
        <CategoriaSelect
          name="filtro_categoria"
          aria-label="Filtrar por categoría"
          categorias={categorias.data}
          placeholder="Todas las categorías"
          value={filtros.categoria}
          onChange={(e) => actualizar("categoria", e.target.value)}
          className="mt-0"
        />
        <SelectField
          name="filtro_estado"
          aria-label="Filtrar por estado"
          opciones={FILTROS_ESTADO}
          value={filtros.estado}
          onChange={(e) => actualizar("estado", e.target.value === "todos" ? "" : e.target.value)}
          className="mt-0"
        />
      </div>

      <div className="mt-6">
        {existencias.isPending ? (
          <Cargando texto="Cargando existencias..." />
        ) : existencias.isError ? (
          <ErrorCarga error={existencias.error} onReintentar={existencias.refetch} />
        ) : existencias.data.existencias.length === 0 ? (
          <Vacio titulo="No hay presentaciones para mostrar" texto="Probá con otros filtros, o cargá productos en el catálogo." />
        ) : (
          <>
            <Tabla
              etiqueta="Existencias"
              filas={existencias.data.existencias}
              clave={(e) => e.variante_id}
              columnas={[
                {
                  titulo: "Producto",
                  principal: true,
                  celda: (e) => (
                    <>
                      <p className="font-semibold">{nombreDe(e)}</p>
                      {e.sku && <p className="text-xs text-texto-suave">{e.sku}</p>}
                    </>
                  ),
                },
                { titulo: "Categoría", celda: (e) => e.categoria, className: "text-texto-suave", enTarjeta: false },
                { titulo: "Cantidad", derecha: true, celda: (e) => (e.controla_stock ? e.cantidad : "—") },
                { titulo: "Reservado", derecha: true, celda: (e) => (e.controla_stock ? e.reservado : "—") },
                { titulo: "Disponible", derecha: true, className: "font-semibold", celda: (e) => (e.controla_stock ? e.disponible : "—") },
                { titulo: "Mínimo", derecha: true, celda: (e) => (e.controla_stock ? e.minimo : "—") },
                {
                  // En la tarjeta va arriba, junto al nombre: es lo primero que se mira
                  titulo: "Estado",
                  principal: true,
                  celda: (e) => <Insignia tono={ESTADOS_STOCK[e.estado].tono}>{ESTADOS_STOCK[e.estado].etiqueta}</Insignia>,
                },
              ]}
              acciones={(e, { enTarjeta }) => {
                // En la tarjeta (celular) con texto: no hay "pasar el mouse" para descubrir qué hace un ícono
                const tamano = enTarjeta ? "chico" : "icono";
                return (
                  <>
                    {e.controla_stock && (
                      <Boton variante="fantasma" tamano={tamano} onClick={() => setAjustando(e)} aria-label={`Ajustar stock de ${nombreDe(e)}`} title="Ajustar">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> {enTarjeta && "Ajustar"}
                      </Boton>
                    )}
                    <Boton variante="fantasma" tamano={tamano} onClick={() => setConfigurando(e)} aria-label={`Configurar stock de ${nombreDe(e)}`} title="Configurar">
                      <Settings2 className="h-4 w-4" aria-hidden="true" /> {enTarjeta && "Configurar"}
                    </Boton>
                    <Boton variante="fantasma" tamano={tamano} a={`/admin/stock/${e.variante_id}`} aria-label={`Historial de ${nombreDe(e)}`} title="Historial">
                      <History className="h-4 w-4" aria-hidden="true" /> {enTarjeta && "Historial"}
                    </Boton>
                  </>
                );
              }}
            />
            <Paginacion paginacion={existencias.data.paginacion} onCambiar={(p) => actualizar("pagina", String(p))} deshabilitado={existencias.isFetching} />
          </>
        )}
      </div>

      {ajustando && <AjusteModal existencia={ajustando} onCerrar={() => setAjustando(null)} />}
      {configurando && <ConfigurarModal existencia={configurando} onCerrar={() => setConfigurando(null)} />}
    </div>
  );
}
