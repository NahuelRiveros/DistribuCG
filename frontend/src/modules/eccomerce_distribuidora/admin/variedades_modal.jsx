import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X, Check } from "lucide-react";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { precioSinIva, formatearPrecio } from "../utils/precio_iva.js";
import { crearVariedad, actualizarVariedad, eliminarVariedad } from "../api/producto_distribuidora_api.js";

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
  const [ivaPorcentaje, setIvaPorcentaje] = useState(variedad.iva_porcentaje ?? 21);
  const [controlaStock, setControlaStock] = useState(variedad.controla_stock ?? false);
  const [cantidad, setCantidad] = useState(variedad.cantidad ?? 0);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function guardar() {
    if (guardando) return; // ya hay un guardado en curso — ignora clicks repetidos
    setGuardando(true);
    try {
      // Solo sale de edición si el guardado realmente terminó bien — antes
      // cerraba el modo edición al toque, así que un guardado que fallaba
      // dejaba la fila mostrando el valor viejo como si nada hubiese pasado.
      const ok = await onGuardar(variedad.id, {
        nombre: nombre.trim() || null, precio: Number(precio), iva_porcentaje: Number(ivaPorcentaje),
        controla_stock: controlaStock, cantidad: controlaStock ? Number(cantidad) : 0,
      });
      if (ok) setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (eliminando) return;
    setEliminando(true);
    try {
      await onEliminar(variedad.id);
    } finally {
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <div className="grid grid-cols-[1fr_75px_55px_110px_auto] items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 p-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (opcional)"
          className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)}
          className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="Precio" />
        <input type="number" step="0.1" value={ivaPorcentaje} onChange={(e) => setIvaPorcentaje(e.target.value)}
          className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="% IVA" title="Alícuota de IVA" />
        <ControlStock controlaStock={controlaStock} setControlaStock={setControlaStock} cantidad={cantidad} setCantidad={setCantidad} />
        <div className="flex shrink-0 gap-1">
          <button
            type="button" title="Guardar" onClick={guardar} disabled={guardando}
            className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-500 disabled:opacity-60"><Check size={13} /></button>
          <button type="button" title="Cancelar" onClick={() => setEditando(false)} disabled={guardando}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-60"><X size={13} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_140px_130px_auto] items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm">
      <span className="font-medium text-slate-800">{variedad.nombre ?? "(sin nombre — variante única)"}</span>
      <span className="text-slate-600">
        <span className="font-semibold text-slate-800">{formatearPrecio(variedad.precio)}</span>
        <br />
        <span className="text-xs text-slate-400">Precio sin IVA: {formatearPrecio(precioSinIva(variedad.precio, variedad.iva_porcentaje))}</span>
      </span>
      <span className="text-xs text-slate-500">
        {variedad.controla_stock ? `${variedad.cantidad} u.` : <span className="italic text-slate-400">Sin control</span>}
      </span>
      <div className="flex gap-1">
        <button type="button" onClick={() => setEditando(true)} disabled={eliminando} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-60"><Edit2 size={13} /></button>
        <button type="button" onClick={eliminar} disabled={eliminando} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

export default function VariedadesModal({ producto, onClose, onCambio }) {
  const [variedades, setVariedades] = useState(producto?.variedades ?? []);
  const [agregando, setAgregando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoIva, setNuevoIva] = useState("21");
  const [nuevoControlaStock, setNuevoControlaStock] = useState(false);
  const [nuevoStock, setNuevoStock] = useState("0");
  const [error, setError] = useState("");
  // Guarda contra doble-submit: sin esto, un click repetido mientras la
  // request todavía está en vuelo disparaba un POST por cada click y creaba
  // variedades duplicadas — el bug reportado ("tarda en cargar y si clickeo
  // rápido confirma muchas veces").
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  useEffect(() => { setVariedades(producto?.variedades ?? []); }, [producto]);

  if (!producto) return null;

  async function agregar() {
    if (guardandoNuevo) return;
    if (!nuevoPrecio) { setError("El precio es requerido"); return; }
    setError("");
    setGuardandoNuevo(true);
    try {
      const r = await crearVariedad(producto.id, {
        nombre: nuevoNombre.trim() || null, precio: Number(nuevoPrecio), iva_porcentaje: Number(nuevoIva) || 21,
        controla_stock: nuevoControlaStock, cantidad: nuevoControlaStock ? (Number(nuevoStock) || 0) : 0,
      });
      if (r?.ok === false) { setError(r.mensaje); return; }
      setVariedades((prev) => [...prev, r.data]);
      setNuevoNombre(""); setNuevoPrecio(""); setNuevoIva("21"); setNuevoControlaStock(false); setNuevoStock("0"); setAgregando(false);
      onCambio();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo agregar la variedad");
    } finally {
      setGuardandoNuevo(false);
    }
  }

  // Devuelve true/false — VariedadRow solo sale de modo edición si el
  // guardado terminó bien de verdad, no apenas se hizo el click.
  async function guardarVariedad(id, payload) {
    try {
      const r = await actualizarVariedad(id, payload);
      if (r?.ok === false) { setError(r.mensaje); return false; }
      setVariedades((prev) => prev.map((v) => (v.id === id ? r.data : v)));
      onCambio();
      return true;
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo guardar la variedad");
      return false;
    }
  }

  async function eliminarVariedadRow(id) {
    if (!window.confirm("¿Eliminar esta variedad?")) return;
    try {
      const r = await eliminarVariedad(id);
      if (r?.ok === false) { setError(r.mensaje); return; }
      setVariedades((prev) => prev.filter((v) => v.id !== id));
      onCambio();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo eliminar la variedad");
    }
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
            <div className="grid grid-cols-[1fr_75px_55px_110px_auto] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2">
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre (opcional)"
                className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
              <input type="number" step="0.01" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} placeholder="Precio"
                className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
              <input type="number" step="0.1" value={nuevoIva} onChange={(e) => setNuevoIva(e.target.value)} placeholder="% IVA" title="Alícuota de IVA"
                className="min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
              <ControlStock controlaStock={nuevoControlaStock} setControlaStock={setNuevoControlaStock} cantidad={nuevoStock} setCantidad={setNuevoStock} />
              <div className="flex shrink-0 gap-1">
                <button type="button" title="Sumar" onClick={agregar} disabled={guardandoNuevo}
                  className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500 disabled:opacity-60"><Check size={13} /></button>
                <button type="button" title="Cancelar" onClick={() => setAgregando(false)} disabled={guardandoNuevo}
                  className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-60"><X size={13} /></button>
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
