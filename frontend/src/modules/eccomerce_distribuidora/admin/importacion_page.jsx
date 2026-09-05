import { useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import SelectField from "../../../controls/ui/select_field.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import { previsualizarImportacion, ejecutarImportacion } from "../api/importacion_distribuidora_api.js";

// Campos que pueden tener los productos del cliente — el admin elige qué
// columna del Excel/CSV corresponde a cada uno. Un renglón = una variedad
// (precio/stock propios); si el producto no tiene variedades, se deja
// "Variedad / presentación" sin mapear.
const CAMPOS = [
  { key: "categoria", label: "Categoría", requerido: false, ayuda: "Podés usar \"Categoría > Subcategoría\" en la misma celda para crear jerarquía." },
  { key: "producto_nombre", label: "Nombre del producto", requerido: true },
  { key: "marca", label: "Marca", requerido: false },
  { key: "descripcion", label: "Descripción", requerido: false },
  { key: "variedad_nombre", label: "Variedad / presentación", requerido: false, ayuda: "Dejalo sin mapear si el producto no tiene variedades." },
  { key: "precio", label: "Precio", requerido: true },
  { key: "iva_porcentaje", label: "% IVA", requerido: false, ayuda: "Si no lo mapeás, se usa 21% por defecto." },
  { key: "cod_ref", label: "Código / SKU", requerido: false, ayuda: "Recomendado — permite reimportar y actualizar en vez de duplicar." },
  { key: "cantidad", label: "Stock", requerido: false, ayuda: "Si lo mapeás, esa variedad queda con control de stock activado." },
];

export default function ImportacionDistribuidoraPage() {
  const inputRef = useRef(null);
  const [paso, setPaso] = useState("subir"); // subir | mapear | resultado
  const [archivo, setArchivo] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filasPreview, setFilasPreview] = useState([]);
  const [totalFilas, setTotalFilas] = useState(0);
  const [mapeo, setMapeo] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const listo = mapeo.producto_nombre && mapeo.precio;

  const filasMapeadas = useMemo(() => {
    if (paso !== "mapear") return [];
    return filasPreview.map((fila) => {
      const out = {};
      for (const c of CAMPOS) out[c.key] = c.key in mapeo && mapeo[c.key] ? fila[mapeo[c.key]] : "";
      return out;
    });
  }, [filasPreview, mapeo, paso]);

  async function onArchivoSeleccionado(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setError("");
    setCargando(true);
    try {
      const r = await previsualizarImportacion(file);
      if (r?.ok === false) { setError(r.mensaje); return; }
      setColumnas(r.data.columnas);
      setFilasPreview(r.data.filas);
      setTotalFilas(r.data.total_filas);
      setMapeo({});
      setPaso("mapear");
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo leer el archivo");
    } finally {
      setCargando(false);
    }
  }

  async function confirmarImportacion() {
    setError("");
    setCargando(true);
    try {
      const r = await ejecutarImportacion(archivo, mapeo);
      if (r?.ok === false) { setError(r.mensaje); return; }
      setResultado(r.data);
      setPaso("resultado");
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo completar la importación");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setPaso("subir");
    setArchivo(null);
    setColumnas([]);
    setFilasPreview([]);
    setTotalFilas(0);
    setMapeo({});
    setResultado(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Importar productos</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Subí un Excel (.xlsx) o CSV con los productos — vos elegís qué columna es cada dato, no hace falta que venga en un formato fijo.
          </p>
        </div>

        <ErrorBanner message={error} />

        {paso === "subir" && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <FileSpreadsheet size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="mb-4 text-sm text-slate-500">Seleccioná el archivo con los productos del cliente (.xlsx o .csv).</p>
            <input ref={inputRef} type="file" accept=".xlsx,.csv" onChange={onArchivoSeleccionado} className="hidden" id="archivo-importacion" />
            <label
              htmlFor="archivo-importacion"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500"
            >
              <Upload size={15} /> {cargando ? "Leyendo…" : "Elegir archivo"}
            </label>
          </div>
        )}

        {paso === "mapear" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{archivo?.name}</p>
                  <p className="text-xs text-slate-500">{totalFilas} fila(s) detectada(s) — decí qué columna es cada campo.</p>
                </div>
                <button type="button" onClick={reiniciar} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-500">
                  <RotateCcw size={13} /> Elegir otro archivo
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CAMPOS.map((campo) => (
                  <div key={campo.key}>
                    <SelectField
                      label={`${campo.label}${campo.requerido ? " *" : ""}`}
                      value={mapeo[campo.key] ?? ""}
                      onChange={(e) => setMapeo((prev) => ({ ...prev, [campo.key]: e.target.value }))}
                      options={columnas.map((c) => ({ value: c, label: c }))}
                      placeholder="No mapear"
                      helperText={campo.ayuda}
                    />
                  </div>
                ))}
              </div>
            </div>

            {filasMapeadas.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vista previa (primeras {filasMapeadas.length} filas)
                </p>
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      {CAMPOS.map((c) => <th key={c.key} className="px-3 py-2 font-semibold">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filasMapeadas.map((fila, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        {CAMPOS.map((c) => (
                          <td key={c.key} className="px-3 py-1.5 text-slate-600">{fila[c.key] || <span className="text-slate-300">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">* Nombre del producto y Precio son obligatorios.</p>
              <button
                type="button" onClick={confirmarImportacion} disabled={!listo || cargando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {cargando ? "Importando…" : `Importar ${totalFilas} fila(s)`} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {paso === "resultado" && resultado && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <CheckCircle2 size={28} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800">Importación completa</p>
                <p className="text-sm text-emerald-700">{resultado.creados} creado(s), {resultado.actualizados} actualizado(s).</p>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <p className="font-bold text-amber-800">{resultado.errores.length} fila(s) con error</p>
                </div>
                <ul className="max-h-60 space-y-1 overflow-y-auto text-sm text-amber-700">
                  {resultado.errores.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            <button
              type="button" onClick={reiniciar}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Importar otro archivo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
