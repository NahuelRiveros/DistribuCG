import { useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import ConfirmDialog from "@/componentes/ui/confirm_dialog.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { useCategorias, useEliminarCategoria, useGuardarCategoria } from "../hooks/use_catalogo.js";
import { armarArbol, totalConSubcategorias } from "../utils/arbol.js";
import CategoriaFormModal from "./categoria_form_modal.jsx";

function NodoCategoria({ nodo, nivel, cerrados, alternar, acciones }) {
  const tieneHijos = nodo.hijos.length > 0;
  const abierto = !cerrados.has(nodo.id);
  const total = totalConSubcategorias(nodo);

  return (
    <li>
      <div className="group flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-fondo" style={{ paddingLeft: `${nivel * 1.5 + 0.5}rem` }}>
        {tieneHijos ? (
          <button
            type="button"
            onClick={() => alternar(nodo.id)}
            aria-expanded={abierto}
            aria-label={`${abierto ? "Contraer" : "Expandir"} ${nodo.nombre}`}
            className="rounded p-0.5 hover:bg-borde"
          >
            {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" aria-hidden="true" />
        )}
        <span className="flex-1 font-medium">{nodo.nombre}</span>
        {nodo.en_menu && <Insignia tono="info">En el menú</Insignia>}
        <span className="text-xs text-texto-suave">
          {total} producto{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-1">
          <Boton variante="fantasma" tamano="icono" onClick={() => acciones.crearDentro(nodo)} aria-label={`Nueva subcategoría en ${nodo.nombre}`} title="Nueva subcategoría">
            <FolderPlus className="h-4 w-4" />
          </Boton>
          <Boton variante="fantasma" tamano="icono" onClick={() => acciones.editar(nodo)} aria-label={`Editar ${nodo.nombre}`} title="Editar">
            <Pencil className="h-4 w-4" />
          </Boton>
          <Boton variante="fantasma" tamano="icono" onClick={() => acciones.eliminar(nodo)} aria-label={`Eliminar ${nodo.nombre}`} title="Eliminar">
            <Trash2 className="h-4 w-4 text-peligro" />
          </Boton>
        </div>
      </div>
      {tieneHijos && abierto && (
        <ul>
          {nodo.hijos.map((hijo) => (
            <NodoCategoria key={hijo.id} nodo={hijo} nivel={nivel + 1} cerrados={cerrados} alternar={alternar} acciones={acciones} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoriasPage() {
  const categorias = useCategorias();
  const guardar = useGuardarCategoria();
  const eliminar = useEliminarCategoria();
  const toast = useToast();
  const [formulario, setFormulario] = useState(null); // { categoria?, padreInicial? }
  const [aEliminar, setAEliminar] = useState(null);
  const [cerrados, setCerrados] = useState(() => new Set());

  const alternar = (id) =>
    setCerrados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  const acciones = {
    crearDentro: (nodo) => setFormulario({ padreInicial: nodo.id }),
    editar: (nodo) => setFormulario({ categoria: nodo }),
    eliminar: setAEliminar,
  };

  async function onGuardar(datos) {
    await guardar.mutateAsync(datos);
    toast.exito(datos.id ? "Categoría actualizada" : "Categoría creada");
    setFormulario(null);
  }

  async function confirmarEliminar() {
    try {
      await eliminar.mutateAsync(aEliminar.id);
      toast.exito("Categoría eliminada");
    } catch (error) {
      // Ej: "La categoría tiene 3 producto(s). Movelos o eliminalos antes."
      toast.error(mensajeDeError(error));
    } finally {
      setAEliminar(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titulos text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-texto-suave">Organizá el catálogo en categorías y subcategorías.</p>
        </div>
        <Boton onClick={() => setFormulario({})}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nueva categoría
        </Boton>
      </header>

      <div className="mt-6">
        {categorias.isPending ? (
          <Cargando />
        ) : categorias.isError ? (
          <ErrorCarga error={categorias.error} onReintentar={categorias.refetch} />
        ) : categorias.data.length === 0 ? (
          <Vacio titulo="Todavía no hay categorías" texto="Creá la primera, por ejemplo “Almacén” o “Bebidas”." />
        ) : (
          <ul className="rounded-2xl border border-borde bg-superficie p-2" aria-label="Árbol de categorías">
            {armarArbol(categorias.data).map((nodo) => (
              <NodoCategoria key={nodo.id} nodo={nodo} nivel={0} cerrados={cerrados} alternar={alternar} acciones={acciones} />
            ))}
          </ul>
        )}
      </div>

      {formulario && (
        <CategoriaFormModal
          categoria={formulario.categoria}
          padreInicial={formulario.padreInicial}
          categorias={categorias.data ?? []}
          onGuardar={onGuardar}
          onCerrar={() => setFormulario(null)}
        />
      )}
      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        titulo="Eliminar categoría"
        mensaje={`¿Eliminar "${aEliminar?.nombre}"? Solo se puede si no tiene productos ni subcategorías.`}
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setAEliminar(null)}
      />
    </div>
  );
}
