import { useMemo, useRef, useState } from "react";
import { Edit2, Plus, FolderPlus, ShieldCheck, ShieldOff, Layers, Trash2, DollarSign } from "lucide-react";
import TreeView from "../../../controls/ui/tree_view.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { useCrudPage } from "../../../hooks/use_crud_page.js";
import { getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from "../api/categoria_distribuidora_api.js";
import {
  getProductos, crearProducto, actualizarProducto, cambiarEstadoProducto, eliminarProducto,
} from "../api/producto_distribuidora_api.js";
import { construirOpcionesCategoria } from "../utils/categoria_jerarquia.js";
import CategoriaFormModal from "./categoria_form_modal.jsx";
import ProductoFormModal from "./producto_form_modal.jsx";
import VariedadesModal from "./variedades_modal.jsx";
import AjustePreciosModal from "./ajuste_precios_modal.jsx";

/**
 * ── página: categorías y productos unificados en un solo árbol ──
 *
 * Los productos se cargan de a una categoría por vez, recién cuando esa
 * categoría se expande (no hay un "traer todos los productos" al entrar a
 * la página) — pensado para miles de productos, donde traer
 * todo de una sería lento y la mayoría ni se llega a ver. Las categorías sí
 * son siempre eager (son pocas, no pesan). `cantidad_productos` viaja con
 * cada categoría (lo agrega el backend) así el árbol sabe qué nodos son
 * expandibles y cuáles están realmente vacíos SIN tener que cargar nada.
 */
export default function ProductosDistribuidoraPage() {
  const [productoVariedades, setProductoVariedades] = useState(null);
  const [ajustePrecios, setAjustePrecios] = useState(null); // null | { producto } | { masivo: true }

  // ── categorías: eager, vía useCrudPage (listado chico, CRUD normal) ──────
  const {
    items: categorias, cargando: cargandoCategorias, error: errorCategorias,
    modalAbierto: modalCategoriaAbierto, seleccionado: categoriaEditar, guardando: guardandoCategoria,
    abrirNuevo: abrirNuevaCategoriaBase, abrirEditar: abrirEditarCategoria, cerrarModal: cerrarModalCategoriaBase,
    guardar: guardarCategoria, ejecutarAccion: ejecutarAccionCategoria, cargar: cargarCategorias,
  } = useCrudPage({
    fetchFn: getCategorias,
    createFn: crearCategoria,
    updateFn: actualizarCategoria,
    extractItems: (r) => r ?? [],
    mensajeErrorCarga: "No se pudo cargar el listado de categorías",
  });

  // ── productos: perezoso, uno por categoría ────────────────────────────────
  // { [categoria_id]: producto[] } — solo tiene entradas para categorías que
  // ya se expandieron alguna vez (o que aparecieron en una búsqueda).
  const [productosPorCategoria, setProductosPorCategoria] = useState({});
  // Qué categorías ya se pidieron al servidor (loading o listo) — evita
  // repetir el fetch cada vez que se vuelve a expandir la misma categoría.
  const cargadasRef = useRef(new Set());
  const [errorProducto, setErrorProducto] = useState("");

  async function cargarProductosDeCategoria(categoriaId, { forzar = false } = {}) {
    if (!forzar && cargadasRef.current.has(categoriaId)) return;
    cargadasRef.current.add(categoriaId);
    try {
      // incluirDescendientes:false — acá queremos SOLO lo propio de esta
      // categoría puntual; las subcategorías ya están en el árbol aparte,
      // si además tuviéramos los descendientes se duplicaría/mezclaría todo
      // bajo el nodo equivocado.
      const r = await getProductos({ categoria: categoriaId, incluirDescendientes: false, por_pagina: 1000 });
      setProductosPorCategoria((prev) => ({ ...prev, [categoriaId]: r.data ?? [] }));
    } catch {
      cargadasRef.current.delete(categoriaId); // permite reintentar si falló
      setErrorProducto("No se pudieron cargar los productos de esa categoría");
    }
  }

  function refrescarCategoria(categoriaId) {
    return cargarProductosDeCategoria(categoriaId, { forzar: true });
  }

  // Solo pedimos productos al expandir si la categoría tiene algo propio
  // cargado (cantidad_productos > 0) — si es puramente organizativa (todo
  // su contenido son subcategorías), expandirla no debería pegarle al
  // servidor para nada, sus hijas ya están en el árbol eager.
  function onExpandirNodo(nodo) {
    if (nodo.tipo !== "categoria") return undefined;
    const cat = categorias.find((c) => c.id === nodo.id);
    if (!cat || (cat.cantidad_productos ?? 0) === 0) return undefined;
    return cargarProductosDeCategoria(nodo.id);
  }

  // Buscador del árbol — además del filtro local (ya lo hace TreeView), le
  // pega al servidor sin restricción de categoría para encontrar productos
  // en categorías todavía no expandidas, y los suma al cache por categoría.
  const busquedaTimeoutRef = useRef(null);
  function onQueryChange(texto) {
    clearTimeout(busquedaTimeoutRef.current);
    const q = texto.trim();
    if (!q) return;
    busquedaTimeoutRef.current = setTimeout(async () => {
      try {
        const r = await getProductos({ q, por_pagina: 100 });
        const porCategoria = {};
        for (const p of r.data ?? []) (porCategoria[p.categoria_id] ??= []).push(p);
        setProductosPorCategoria((prev) => {
          const next = { ...prev };
          for (const [catId, prods] of Object.entries(porCategoria)) {
            const existentes = next[catId] ?? [];
            const idsExistentes = new Set(existentes.map((x) => x.id));
            next[catId] = [...existentes, ...prods.filter((p) => !idsExistentes.has(p.id))];
          }
          return next;
        });
      } catch { /* búsqueda falló silenciosamente, no rompe el árbol */ }
    }, 350);
  }

  const opcionesCategoria = useMemo(() => construirOpcionesCategoria(categorias), [categorias]);

  // ── modal de producto (alta/edición) — manejo propio, no useCrudPage,
  // porque acá no hay un único "items" para refrescar: hay que refrescar la
  // categoría destino (y la de origen, si se cambió de categoría al editar).
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [categoriaPreseleccionada, setCategoriaPreseleccionada] = useState(null);
  const [padrePreseleccionado, setPadrePreseleccionado] = useState(null);

  function abrirNuevoProducto() {
    setProductoEditar(null);
    setModalProductoAbierto(true);
  }

  function abrirNuevoEnCategoria(categoriaId) {
    setCategoriaPreseleccionada(categoriaId);
    abrirNuevoProducto();
  }

  function abrirEditarProducto(row) {
    setProductoEditar(row);
    setModalProductoAbierto(true);
  }

  function cerrarModalProducto() {
    setModalProductoAbierto(false);
    setProductoEditar(null);
    setCategoriaPreseleccionada(null);
  }

  async function guardarProducto(payload) {
    setGuardandoProducto(true);
    setErrorProducto("");
    try {
      const categoriaAnterior = productoEditar?.categoria_id;
      const r = productoEditar
        ? await actualizarProducto(productoEditar.id, payload)
        : await crearProducto(payload);
      if (r?.ok === false) { setErrorProducto(r.mensaje); return; }
      cerrarModalProducto();
      await refrescarCategoria(payload.categoria_id);
      if (categoriaAnterior && categoriaAnterior !== payload.categoria_id) await refrescarCategoria(categoriaAnterior);
      await cargarCategorias(); // los conteos (cantidad_productos) pueden haber cambiado
    } catch (e) {
      setErrorProducto(e?.response?.data?.mensaje || "No se pudo guardar el producto");
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function ejecutarAccionProducto(row, fn, { confirmMessage, mensajeError, refrescarConteos = false }) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    try {
      const r = await fn();
      if (r?.ok === false) { setErrorProducto(r.mensaje || mensajeError); return; }
      await refrescarCategoria(row.categoria_id);
      if (refrescarConteos) await cargarCategorias();
    } catch (e) {
      setErrorProducto(e?.response?.data?.mensaje || mensajeError);
    }
  }

  function toggleEstado(row) {
    const nuevoEstado = !row.activo;
    ejecutarAccionProducto(row, () => cambiarEstadoProducto(row.id, nuevoEstado), {
      confirmMessage: `¿Seguro que querés ${nuevoEstado ? "activar" : "desactivar"} "${row.nombre}"?`,
      mensajeError: "No se pudo cambiar el estado",
    });
  }

  function eliminarProductoNodo(row) {
    ejecutarAccionProducto(row, () => eliminarProducto(row.id), {
      confirmMessage: `¿Eliminar el producto "${row.nombre}"? Esto también elimina sus variedades. No se puede deshacer desde acá.`,
      mensajeError: "No se pudo eliminar el producto",
      refrescarConteos: true,
    });
  }

  // ── categorías: alta de subcategoría / raíz ───────────────────────────────
  function abrirNuevaSubcategoria(padreId) {
    setPadrePreseleccionado(padreId);
    abrirNuevaCategoriaBase();
  }

  function abrirNuevaCategoriaRaiz() {
    setPadrePreseleccionado(null);
    abrirNuevaCategoriaBase();
  }

  function cerrarModalCategoria() {
    cerrarModalCategoriaBase();
    setPadrePreseleccionado(null);
  }

  function tieneSubcategorias(nodo) {
    return categorias.some((c) => c.padre_id === nodo.id);
  }

  // Solo se puede borrar una categoría vacía (sin subcategorías ni
  // productos) — evita perder productos/subcategorías "escondidos" abajo
  // sin querer al limpiar una categoría creada de más por error.
  function categoriaEsHoja(nodo) {
    const cat = categorias.find((c) => c.id === nodo.id);
    return !tieneSubcategorias(nodo) && (cat?.cantidad_productos ?? 0) === 0;
  }

  function eliminarCategoriaNodo(nodo) {
    ejecutarAccionCategoria(() => eliminarCategoria(nodo.id), {
      confirmMessage: `¿Eliminar la categoría "${nodo.nombre}"? Está vacía, no tiene productos ni subcategorías.`,
      mensajeError: "No se pudo eliminar la categoría",
    });
  }

  // El árbol combina dos entidades: categorías (todas, eager) y productos
  // (solo los de las categorías ya expandidas/buscadas). Prefijamos los ids
  // para que no choquen entre sí.
  const treeItems = useMemo(() => {
    const productosFlat = Object.values(productosPorCategoria).flat();
    return [
      ...categorias.map((c) => ({
        ...c, tipo: "categoria",
        treeId: `cat-${c.id}`, treeParentId: c.padre_id != null ? `cat-${c.padre_id}` : null,
        // le dice a TreeView "esto capaz tiene hijos que todavía no llegaron"
        // (productos propios sin cargar) aunque `children` esté vacío por ahora.
        siempreExpandible: (c.cantidad_productos ?? 0) > 0,
      })),
      ...productosFlat.map((p) => ({
        ...p, tipo: "producto",
        treeId: `prod-${p.id}`, treeParentId: `cat-${p.categoria_id}`,
      })),
    ];
  }, [categorias, productosPorCategoria]);

  function renderLabel(nodo) {
    if (nodo.tipo === "categoria") {
      return <span className="font-semibold text-slate-800">{nodo.nombre}</span>;
    }
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-700">{nodo.nombre}</span>
        {nodo.marca && <span className="text-xs text-slate-400">({nodo.marca})</span>}
        <span className="text-xs text-slate-400">{nodo.variedades?.length ?? 0} var.</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${nodo.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {nodo.activo ? <ShieldCheck size={9} /> : <ShieldOff size={9} />}
          {nodo.activo ? "Activo" : "Inactivo"}
        </span>
      </span>
    );
  }

  const esProducto = (n) => n.tipo === "producto";
  const esCategoria = (n) => n.tipo === "categoria";
  const actions = [
    { key: "agregar-subcategoria", label: "Nueva subcategoría acá", icon: <FolderPlus size={12} />, variant: "primary", onClick: (nodo) => abrirNuevaSubcategoria(nodo.id), show: esCategoria },
    // Agregar producto solo en el último nivel — una categoría con
    // subcategorías es "de organización", el producto va en la hoja.
    { key: "agregar-producto", label: "Agregar producto acá", icon: <Plus size={12} />, variant: "success", onClick: (nodo) => abrirNuevoEnCategoria(nodo.id), show: (n) => esCategoria(n) && !tieneSubcategorias(n) },
    { key: "editar-categoria", label: "Editar categoría", icon: <Edit2 size={12} />, variant: "primary", onClick: abrirEditarCategoria, show: esCategoria },
    { key: "eliminar-categoria", label: "Eliminar categoría vacía", icon: <Trash2 size={12} />, variant: "danger", onClick: eliminarCategoriaNodo, show: (n) => esCategoria(n) && categoriaEsHoja(n) },
    { key: "variedades", label: "Variedades", icon: <Layers size={12} />, variant: "primary", onClick: (row) => setProductoVariedades(row), show: esProducto },
    { key: "ajustar", label: "Ajustar", icon: <DollarSign size={12} />, variant: "primary", onClick: (row) => setAjustePrecios({ producto: row }), show: esProducto },
    { key: "editar", label: "Editar", icon: <Edit2 size={12} />, variant: "primary", onClick: abrirEditarProducto, show: esProducto },
    { key: "desactivar", label: "Desactivar", icon: <ShieldOff size={12} />, variant: "danger", onClick: toggleEstado, show: (n) => esProducto(n) && n.activo },
    { key: "activar", label: "Activar", icon: <ShieldCheck size={12} />, variant: "success", onClick: toggleEstado, show: (n) => esProducto(n) && !n.activo },
    { key: "eliminar-producto", label: "Eliminar producto", icon: <Trash2 size={12} />, variant: "danger", onClick: eliminarProductoNodo, show: esProducto },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Categorías y productos</h1>
            <p className="mt-0.5 text-sm text-slate-500">Categorías y productos en un solo lugar — cada producto necesita al menos una variedad con precio.</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button" onClick={abrirNuevaCategoriaRaiz}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <FolderPlus size={14} /> Nueva categoría
            </button>
            <button
              type="button" onClick={() => setAjustePrecios({ masivo: true })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <DollarSign size={14} /> Ajuste masivo
            </button>
            <button
              type="button" onClick={abrirNuevoProducto}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
            >
              <Plus size={14} /> Nuevo producto
            </button>
          </div>
        </div>

        <ErrorBanner message={errorCategorias || errorProducto} />

        <TreeView
          items={treeItems}
          keyField="treeId"
          parentField="treeParentId"
          renderLabel={renderLabel}
          searchIn={(n) => n.nombre ?? ""}
          onQueryChange={onQueryChange}
          onExpandir={onExpandirNodo}
          loading={cargandoCategorias}
          searchable
          searchPlaceholder="Buscar producto…"
          emptyMessage="No hay categorías cargadas todavía."
          actions={actions}
        />

      </div>

      <ProductoFormModal
        key={productoEditar?.id ?? `nuevo-${categoriaPreseleccionada ?? "sin-categoria"}`}
        abierto={modalProductoAbierto}
        onClose={cerrarModalProducto}
        onGuardar={guardarProducto}
        productoEditar={productoEditar}
        guardando={guardandoProducto}
        opcionesCategoria={opcionesCategoria}
        categoriaInicial={categoriaPreseleccionada}
      />

      <CategoriaFormModal
        key={categoriaEditar?.id ?? `nueva-cat-${padrePreseleccionado ?? "raiz"}`}
        abierto={modalCategoriaAbierto}
        onClose={cerrarModalCategoria}
        onGuardar={guardarCategoria}
        categoriaEditar={categoriaEditar}
        guardando={guardandoCategoria}
        categorias={categorias}
        padreInicial={padrePreseleccionado}
      />

      {productoVariedades && (
        <VariedadesModal
          producto={productoVariedades}
          onClose={() => { setProductoVariedades(null); refrescarCategoria(productoVariedades.categoria_id); }}
          onCambio={() => refrescarCategoria(productoVariedades.categoria_id)}
        />
      )}

      {ajustePrecios && (
        <AjustePreciosModal
          productoFijo={ajustePrecios.producto}
          opcionesCategoria={opcionesCategoria}
          onClose={() => setAjustePrecios(null)}
          onAplicado={() => {}}
        />
      )}
    </div>
  );
}
