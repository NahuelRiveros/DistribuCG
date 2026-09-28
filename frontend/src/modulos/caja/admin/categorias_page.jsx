import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { mensajeDeError } from "@/api/http.js";
import { cn } from "@/utils/cn.js";
import { useCategoriasCaja, useCrearCategoria, useEditarCategoria } from "../hooks/use_caja.js";
import { TIPOS } from "../utils/presentacion.js";
import CategoriaFormModal from "./categoria_form_modal.jsx";

export default function CategoriasPage() {
  const categorias = useCategoriasCaja();
  const crear = useCrearCategoria();
  const editar = useEditarCategoria();
  const toast = useToast();
  const [formulario, setFormulario] = useState(null); // { tipo, categoria? }

  async function guardar(datos) {
    await (datos.id ? editar : crear).mutateAsync(datos);
    toast.exito(datos.id ? "Categoría renombrada" : "Categoría creada");
    setFormulario(null);
  }

  async function alternarActiva(c) {
    try {
      await editar.mutateAsync({ id: c.id, activa: !c.activa });
      toast.exito(c.activa ? `"${c.nombre}" ya no se ofrece al cargar` : `"${c.nombre}" vuelve a estar disponible`);
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-titulos text-2xl font-bold">Categorías</h1>
        <p className="text-sm text-texto-suave">
          Los tipos de ingreso y de egreso que se eligen al cargar un movimiento. Desactivar una no borra sus movimientos: siguen sumando en el balance.
        </p>
      </header>

      {categorias.isPending ? (
        <Cargando texto="Cargando categorías..." />
      ) : categorias.isError ? (
        <ErrorCarga error={categorias.error} onReintentar={categorias.refetch} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(TIPOS).map(([tipo, t]) => (
            <section key={tipo} aria-labelledby={`tipo-${tipo}`} className="rounded-2xl border border-borde bg-superficie p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id={`tipo-${tipo}`} className="flex items-center gap-2 text-lg font-bold">
                  <span className={cn("h-3 w-3 rounded-sm", t.serie)} aria-hidden="true" /> {t.plural}
                </h2>
                <Boton tamano="chico" variante="secundario" onClick={() => setFormulario({ tipo })} aria-label={`Nueva categoría de ${t.plural.toLowerCase()}`}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Nueva
                </Boton>
              </div>
              <ul className="mt-3 divide-y divide-borde">
                {categorias.data
                  .filter((c) => c.tipo === tipo)
                  .map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <span className={cn("flex-1 font-medium", !c.activa && "text-texto-suave")}>{c.nombre}</span>
                      {!c.activa && <Insignia>Desactivada</Insignia>}
                      <span className="text-xs text-texto-suave">{c.movimientos === 1 ? "1 movimiento" : `${c.movimientos} movimientos`}</span>
                      <Boton variante="fantasma" tamano="icono" onClick={() => setFormulario({ tipo, categoria: c })} aria-label={`Renombrar ${c.nombre}`} title="Renombrar">
                        <Pencil className="h-4 w-4" />
                      </Boton>
                      <Boton variante="fantasma" tamano="chico" onClick={() => alternarActiva(c)}>
                        {c.activa ? "Desactivar" : "Activar"}
                      </Boton>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {formulario && <CategoriaFormModal tipo={formulario.tipo} categoria={formulario.categoria} onGuardar={guardar} onCerrar={() => setFormulario(null)} />}
    </div>
  );
}
