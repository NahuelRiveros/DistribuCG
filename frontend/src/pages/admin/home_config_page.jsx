import { useEffect, useRef, useState } from "react";
import { Image, Upload, Trash2, ToggleLeft, ToggleRight, RefreshCw, Film } from "lucide-react";
import {
  listarAreasHome,
  listarContenidoHomeAdmin,
  subirContenidoHome,
  cambiarEstadoContenidoHome,
  eliminarContenidoHome,
} from "../../api/home_content_api.js";

const TAMANO_MAX_BYTES = 25 * 1024 * 1024; // 25MB — mismo límite que el backend

export default function HomeConfigPage() {
  const [areas, setAreas] = useState([]);
  const [contenidos, setContenidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [areaId, setAreaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState(0);
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef(null);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      const [resAreas, resContenidos] = await Promise.all([
        listarAreasHome(),
        listarContenidoHomeAdmin(),
      ]);
      setAreas(resAreas.data || []);
      setContenidos(resContenidos.data || []);
      if (!areaId && resAreas.data?.length) setAreaId(String(resAreas.data[0].id));
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo cargar el contenido del home");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarDatos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onSeleccionarArchivo(event) {
    const f = event.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("El archivo debe ser una imagen o un video");
      event.target.value = "";
      return;
    }
    if (f.size > TAMANO_MAX_BYTES) {
      setError("El archivo es muy pesado. Máximo 25 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setArchivo(f);
  }

  function limpiarFormulario() {
    setTitulo("");
    setDescripcion("");
    setOrden(0);
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmitUpload(e) {
    e.preventDefault();
    if (!areaId) { setError("Elegí un área"); return; }
    if (!archivo) { setError("Elegí una imagen o video para subir"); return; }

    try {
      setSubiendo(true);
      setError("");
      await subirContenidoHome({ area_id: areaId, titulo, descripcion, orden, archivo });
      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo subir el contenido");
    } finally {
      setSubiendo(false);
    }
  }

  async function toggleEstado(item) {
    try {
      await cambiarEstadoContenidoHome(item.id, !item.activo);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo cambiar el estado");
    }
  }

  async function eliminar(item) {
    if (!window.confirm(`¿Borrar "${item.titulo || "este contenido"}"? Se elimina también de Cloudinary.`)) return;
    try {
      await eliminarContenidoHome(item.id);
      await cargarDatos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo eliminar el contenido");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Image size={11} />
                Admin
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Contenido del home</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Subí imágenes y videos para las galerías públicas de Gym y Kinesiología.
              </p>
            </div>
            <button
              type="button" onClick={cargarDatos} disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── FORMULARIO DE SUBIDA ── */}
        <form onSubmit={onSubmitUpload} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700">Subir nuevo contenido</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Área</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.descripcion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Sala de musculación"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Texto corto que acompaña la imagen o video"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none resize-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex w-full items-center justify-between rounded-xl border-2 border-dashed px-4 py-3 text-left text-sm font-semibold transition ${
                archivo ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-500 hover:border-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Upload size={15} className="shrink-0" />
                <span className="truncate">{archivo ? archivo.name : "Elegir imagen o video…"}</span>
              </span>
              {archivo && <span className="shrink-0 text-xs font-bold text-blue-600">Listo</span>}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={onSeleccionarArchivo}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={subiendo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
          >
            <Upload size={14} /> {subiendo ? "Subiendo…" : "Subir contenido"}
          </button>
        </form>

        {/* ── CONTENIDO POR ÁREA ── */}
        {areas.map((area) => {
          const items = contenidos.filter((c) => c.area_id === area.id);
          return (
            <div key={area.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-3">
                {area.descripcion} <span className="text-slate-400 font-normal">({items.length})</span>
              </h2>

              {items.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay contenido para esta área.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="relative h-32 bg-slate-100">
                        {item.tipo_media === "video" ? (
                          <video src={item.cloudinary_url} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={item.cloudinary_url} alt={item.titulo || ""} className="h-full w-full object-cover" />
                        )}
                        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.tipo_media === "video" ? <Film size={10} /> : <Image size={10} />}
                          {item.tipo_media}
                        </span>
                        <span className={`absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.activo ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                        }`}>
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-700 truncate" title={item.titulo}>
                          {item.titulo || "Sin título"}
                        </p>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleEstado(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                          >
                            {item.activo ? <ToggleRight size={14} className="text-emerald-600" /> : <ToggleLeft size={14} />}
                            {item.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminar(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={12} /> Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
