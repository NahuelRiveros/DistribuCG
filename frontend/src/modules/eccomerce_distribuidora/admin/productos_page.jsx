import { useEffect, useState } from "react";
import { Edit2, Plus, ShieldCheck, ShieldOff, Layers, Trash2, X, Percent } from "lucide-react";
import DataGrid from "../../../controls/ui/data_grid.jsx";
import InputField from "../../../controls/ui/input_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { useCrudPage } from "../../../hooks/use_crud_page.js";
import { getCategorias } from "../api/categoria_distribuidora_api.js";
import {
  getProductos, crearProducto, actualizarProducto, cambiarEstadoProducto,
  crearVariedad, actualizarVariedad, eliminarVariedad, ajustarPreciosMasivo,
} from "../api/producto_distribuidora_api.js";

/* ── modal: alta/edición del producto (sin variedades) ─────────────────── */

function ProductoFormModal({ abierto, onClose, onGuardar, productoEditar, guardando, categorias }) {
  const [categoriaId, setCategoriaId] = useState(productoEditar?.categoria_id ?? "");
  const [nombre, setNombre] = useState(productoEditar?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(productoEditar?.descripcion ?? "");
  const [marca, setMarca] = useState(productoEditar?.marca ?? "");
  const [imagenUrl, setImagenUrl] = useState(productoEditar?.imagen_url ?? "");

  if (!abierto) return null;

  function submit(e) {
    e.preventDefault();
    onGuardar({
      categoria_id: Number(categoriaId),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      marca: marca.trim() || null,
      imagen_url: imagenUrl.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {productoEditar ? "Editar producto" : "Nuevo producto"}
          </h2>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <SelectField
            label="Categoría"
            options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          />
          <InputField label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} hideMessage placeholder="Ej: Galletitas Oreo" />
          <InputField label="Marca (opcional)" type="text" value={marca} onChange={(e) => setMarca(e.target.value)} hideMessage placeholder="Ej: Terrabusi" />
          <InputField label="Descripción (opcional)" type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} hideMessage />
          <InputField label="URL de imagen (opcional)" type="text" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} hideMessage placeholder="https://…" />

          {!productoEditar && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Después de crear el producto, agregale al menos una variedad (con precio) para que sea comprable.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={guardando}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={guardando || !categoriaId}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── modal: variedades de un producto (precio/stock propios) ──────────── */

function ControlStock({ controlaStock, setControlaStock, cantidad, setCantidad }) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <input type="checkbox" checked={controlaStock} onChange={(e) => setControlaStock(e.target.checked)} />
        Stock
      </label>
      {controlaStock && (
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
          className="w-16 rounded-lg border border-gray-300 px-1.5 py-1.5 text-sm" placeholder="Cant." />
      )}
    </div>
  );
}

function VariedadRow({ variedad, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(variedad.nombre ?? "");
  const [precio, setPrecio] = useState(variedad.precio);
  const [controlaStock, setControlaStock] = useState(variedad.controla_stock ?? false);
  const [cantidad, setCantidad] = useState(variedad.cantidad ?? 0);

  if (editando) {
    return (
      <div className="grid grid-cols-[1fr_90px_130px_auto] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Original 118g"
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="Precio" />
        <ControlStock controlaStock={controlaStock} setControlaStock={setControlaStock} cantidad={cantidad} setCantidad={setCantidad} />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              onGuardar(variedad.id, { nombre: nombre.trim() || null, precio: Number(precio), controla_stock: controlaStock, cantidad: controlaStock ? Number(cantidad) : 0 });
              setEditando(false);
            }}
            className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-blue-500">Guardar</button>
          <button type="button" onClick={() => setEditando(false)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_90px_130px_auto] items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm">
      <span className="font-medium text-slate-800">{variedad.nombre ?? "(sin nombre — variante única)"}</span>
      <span className="text-slate-600">${Number(variedad.precio).toLocaleString("es-AR")}</span>
      <span className="text-xs text-slate-500">
        {variedad.controla_stock ? `${variedad.cantidad} u.` : <span className="italic text-slate-400">Sin control</span>}
      </span>
      <div className="flex gap-1">
        <button type="button" onClick={() => setEditando(true)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Edit2 size={13} /></button>
        <button type="button" onClick={() => onEliminar(variedad.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function VariedadesModal({ producto, onClose, onCambio }) {
  const [variedades, setVariedades] = useState(producto?.variedades ?? []);
  const [agregando, setAgregando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoControlaStock, setNuevoControlaStock] = useState(false);
  const [nuevoStock, setNuevoStock] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => { setVariedades(producto?.variedades ?? []); }, [producto]);

  if (!producto) return null;

  async function agregar() {
    if (!nuevoPrecio) { setError("El precio es requerido"); return; }
    setError("");
    const r = await crearVariedad(producto.id, {
      nombre: nuevoNombre.trim() || null, precio: Number(nuevoPrecio),
      controla_stock: nuevoControlaStock, cantidad: nuevoControlaStock ? (Number(nuevoStock) || 0) : 0,
    });
    if (r?.ok === false) { setError(r.mensaje); return; }
    setVariedades((prev) => [...prev, r.data]);
    setNuevoNombre(""); setNuevoPrecio(""); setNuevoControlaStock(false); setNuevoStock("0"); setAgregando(false);
    onCambio();
  }

  async function guardarVariedad(id, payload) {
    const r = await actualizarVariedad(id, payload);
    if (r?.ok === false) { setError(r.mensaje); return; }
    setVariedades((prev) => prev.map((v) => (v.id === id ? r.data : v)));
    onCambio();
  }

  async function eliminarVariedadRow(id) {
    if (!window.confirm("¿Eliminar esta variedad?")) return;
    const r = await eliminarVariedad(id);
    if (r?.ok === false) { setError(r.mensaje); return; }
    setVariedades((prev) => prev.filter((v) => v.id !== id));
    onCambio();
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Variedades de "{producto.nombre}"</h2>
            <p className="text-xs text-slate-500">Cada variedad tiene su propio precio. El stock es opcional — tildá "Stock" solo si querés controlarlo acá.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-4">
          <ErrorBanner message={error} />

          {variedades.length === 0 && !agregando && (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              Sin variedades todavía — el producto no aparece comprable hasta que agregues al menos una.
            </p>
          )}

          {variedades.map((v) => (
            <VariedadRow key={v.id} variedad={v} onGuardar={guardarVariedad} onEliminar={eliminarVariedadRow} />
          ))}

          {agregando ? (
            <div className="grid grid-cols-[1fr_90px_130px_auto] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2">
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Familiar 300g (opcional)"
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
              <input type="number" step="0.01" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} placeholder="Precio"
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
              <ControlStock controlaStock={nuevoControlaStock} setControlaStock={setNuevoControlaStock} cantidad={nuevoStock} setCantidad={setNuevoStock} />
              <div className="flex gap-1">
                <button type="button" onClick={agregar} className="rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Sumar</button>
                <button type="button" onClick={() => setAgregando(false)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">X</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAgregando(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600">
              <Plus size={14} /> Agregar variedad
            </button>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── modal: ajuste de precios (individual por producto, o masivo por
   categoría/todo el catálogo) — mismo endpoint, distinto alcance ────────── */

function AjustePreciosModal({ productoFijo, categorias, onClose, onAplicado }) {
  const [alcance, setAlcance] = useState(productoFijo ? "producto" : "categoria");
  const [categoriaId, setCategoriaId] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [confirmarTodo, setConfirmarTodo] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const titulo = productoFijo ? `Ajustar precio de "${productoFijo.nombre}"` : "Ajuste masivo de precios";

  async function aplicar() {
    const pct = Number(porcentaje);
    if (!porcentaje || Number.isNaN(pct) || pct === 0) { setError("Ingresá un porcentaje distinto de 0 (ej: 10 o -5)"); return; }
    if (alcance === "categoria" && !categoriaId) { setError("Elegí una categoría"); return; }
    if (alcance === "todo" && !confirmarTodo) { setError("Tildá la confirmación para aplicar a todo el catálogo"); return; }

    setError("");
    setAplicando(true);
    try {
      const payload = { porcentaje: pct };
      if (productoFijo) payload.producto_id = productoFijo.id;
      else if (alcance === "categoria") payload.categoria_id = Number(categoriaId);
      else payload.confirmarTodoElCatalogo = true;

      const r = await ajustarPreciosMasivo(payload);
      if (r?.ok === false) { setError(r.mensaje); return; }
      setResultado(r.data.cantidad);
      onAplicado();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo aplicar el ajuste");
    } finally {
      setAplicando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <ErrorBanner message={error} />

          {resultado !== null ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Listo — se actualizaron {resultado} variedad(es).
            </div>
          ) : (
            <>
              {!productoFijo && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAlcance("categoria")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${alcance === "categoria" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-500"}`}>
                    Por categoría
                  </button>
                  <button type="button" onClick={() => setAlcance("todo")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${alcance === "todo" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-300 text-slate-500"}`}>
                    Todo el catálogo
                  </button>
                </div>
              )}

              {!productoFijo && alcance === "categoria" && (
                <SelectField
                  label="Categoría"
                  options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                />
              )}

              <InputField
                label="Porcentaje (positivo sube, negativo baja)"
                type="number" step="0.1"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                hideMessage placeholder="Ej: 10 o -5"
              />

              {!productoFijo && alcance === "todo" && (
                <label className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                  <input type="checkbox" checked={confirmarTodo} onChange={(e) => setConfirmarTodo(e.target.checked)} className="mt-0.5" />
                  Sí, quiero aplicar este ajuste a TODOS los productos del catálogo.
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={aplicando}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  Cancelar
                </button>
                <button type="button" onClick={aplicar} disabled={aplicando}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  <Percent size={14} /> {aplicando ? "Aplicando..." : "Aplicar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── página ──────────────────────────────────────────────────────────────── */

export default function ProductosDistribuidoraPage() {
  const [categorias, setCategorias] = useState([]);
  const [productoVariedades, setProductoVariedades] = useState(null);
  const [ajustePrecios, setAjustePrecios] = useState(null); // null | { producto } | { masivo: true }

  const {
    items, cargando, error,
    modalAbierto, seleccionado, guardando,
    abrirNuevo, abrirEditar, cerrarModal, guardar, ejecutarAccion, cargar,
  } = useCrudPage({
    fetchFn: () => getProductos({ por_pagina: 100 }),
    createFn: crearProducto,
    updateFn: actualizarProducto,
    mensajeErrorCarga: "No se pudo cargar el listado de productos",
  });

  useEffect(() => { getCategorias().then(setCategorias).catch(() => {}); }, []);

  function toggleEstado(row) {
    const nuevoEstado = !row.activo;
    ejecutarAccion(() => cambiarEstadoProducto(row.id, nuevoEstado), {
      confirmMessage: `¿Seguro que querés ${nuevoEstado ? "activar" : "desactivar"} "${row.nombre}"?`,
      mensajeError: "No se pudo cambiar el estado",
    });
  }

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, searchable: true, className: "font-semibold text-slate-800" },
    { key: "marca", label: "Marca", render: (row) => row.marca ?? "—" },
    { key: "categoria", label: "Categoría", render: (row) => row.categoria?.nombre ?? "—" },
    {
      key: "variedades", label: "Variedades",
      render: (row) => `${row.variedades?.length ?? 0}`,
    },
    {
      key: "activo", label: "Estado",
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${row.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {row.activo ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
          {row.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const actions = [
    { key: "variedades", label: "Variedades", icon: <Layers size={12} />, variant: "primary", onClick: (row) => setProductoVariedades(row) },
    { key: "ajustar", label: "Ajustar %", icon: <Percent size={12} />, variant: "primary", onClick: (row) => setAjustePrecios({ producto: row }) },
    { key: "editar", label: "Editar", icon: <Edit2 size={12} />, variant: "primary", onClick: abrirEditar },
    { key: "desactivar", label: "Desactivar", icon: <ShieldOff size={12} />, variant: "danger", onClick: toggleEstado, show: (row) => row.activo },
    { key: "activar", label: "Activar", icon: <ShieldCheck size={12} />, variant: "success", onClick: toggleEstado, show: (row) => !row.activo },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Productos</h1>
            <p className="mt-0.5 text-sm text-slate-500">Catálogo de distribuidora — cada producto necesita al menos una variedad con precio.</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              type="button" onClick={() => setAjustePrecios({ masivo: true })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <Percent size={14} /> Ajuste masivo
            </button>
            <button
              type="button" onClick={abrirNuevo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
            >
              <Plus size={14} /> Nuevo producto
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        <DataGrid
          rows={items}
          columns={columns}
          keyField="id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar producto…"
          emptyMessage="No hay productos cargados."
          actions={actions}
          pageSize={20}
          pageSizeOptions={[10, 20, 50]}
        />

      </div>

      <ProductoFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardar}
        productoEditar={seleccionado}
        guardando={guardando}
        categorias={categorias}
      />

      {productoVariedades && (
        <VariedadesModal
          producto={productoVariedades}
          onClose={() => { setProductoVariedades(null); cargar(); }}
          onCambio={cargar}
        />
      )}

      {ajustePrecios && (
        <AjustePreciosModal
          productoFijo={ajustePrecios.producto}
          categorias={categorias}
          onClose={() => { setAjustePrecios(null); cargar(); }}
          onAplicado={cargar}
        />
      )}
    </div>
  );
}
