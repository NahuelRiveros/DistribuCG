import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Download, PackagePlus, Trash2 } from "lucide-react";
import AdminSpinner from "../../../core/controls/ui/admin_spinner.jsx";
import ErrorBanner from "../../../core/controls/ui/error_banner.jsx";
import Modal from "../../../core/controls/ui/modal.jsx";
import { downloadBlob } from "../../../core/controls/importacion/download.js";
import { useToast } from "../../../core/controls/toast/use_toast.js";
import { FRASE_LIMPIAR } from "../api/mantenimiento_catalogo_api.js";
import { mensajeDeError, useCargarCatalogo, useCopiaCatalogo, useEstadoCatalogo, useLimpiarCatalogo } from "./use_mantenimiento_catalogo.js";

const BOTON = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 sm:w-auto";
const SECUNDARIO = `${BOTON} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
const numero = (n) => Number(n ?? 0).toLocaleString("es-AR");

function LimpiarModal({ onClose }) {
  const toast = useToast();
  const [frase, setFrase] = useState("");
  const limpiar = useLimpiarCatalogo();
  const confirmar = () => limpiar.mutate(undefined, {
    onSuccess: (r) => { toast.success(`Se borraron ${numero(r.articulos)} artículos, ${numero(r.categorias)} categorías y ${numero(r.marcas)} marcas.`); onClose(); },
  });
  return (
    <Modal title="Limpiar todos los artículos" onClose={onClose} busy={limpiar.isPending}>
      <div className="space-y-3 text-sm">
        <p>Se borran <b>todos</b> los artículos, presentaciones, categorías y marcas, los carritos y los precios especiales regionales.
          Los pedidos conservan su detalle. Las fotos de Cloudinary no se tocan. <b>No se puede deshacer.</b></p>
        <label className="block">
          <span className="font-semibold">Para confirmar, escribí <code className="rounded bg-slate-100 px-1">{FRASE_LIMPIAR}</code></span>
          <input value={frase} onChange={(e) => setFrase(e.target.value)} autoComplete="off" disabled={limpiar.isPending}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
        </label>
        {limpiar.isError && <ErrorBanner message={mensajeDeError(limpiar.error, "No se pudo limpiar. No se borró nada.")} />}
        <button type="button" disabled={frase !== FRASE_LIMPIAR || limpiar.isPending} onClick={confirmar}
          className={`${BOTON} bg-red-600 text-white hover:bg-red-700`}><Trash2 size={16} /> {limpiar.isPending ? "Borrando…" : "Borrar todo"}</button>
      </div>
    </Modal>
  );
}

function Cantidades({ e }) {
  const filas = [["Artículos", e.articulos], ["Presentaciones", e.presentaciones], ["Categorías", e.categorias], ["Marcas", e.marcas],
    ["Renglones en carritos", e.carritos], ["Precios especiales regionales", e.preciosRegionales], ["Renglones de pedidos con artículo", e.renglonesPedidos]];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {filas.map(([titulo, n]) => (
        <div key={titulo} className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs text-slate-500">{titulo}</dt><dd className="text-xl font-bold">{numero(n)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Panel › Mantenimiento del catálogo (solo super admin): limpiar y recargar el catálogo del cliente (CAT-52 a CAT-58). */
export default function MantenimientoCatalogoPage() {
  const toast = useToast();
  const estado = useEstadoCatalogo();
  const copia = useCopiaCatalogo();
  const carga = useCargarCatalogo();
  const [limpiando, setLimpiando] = useState(false);
  const bajarCopia = () => copia.mutate(undefined, {
    onSuccess: (blob) => downloadBlob(blob, `copia-catalogo-${new Date().toISOString().slice(0, 10)}.csv`),
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo armar la copia.")),
  });
  const e = estado.data;
  const terminada = carga.progreso?.estado === "completado";

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-6">
      <div>
        <h1 className="kt-display text-2xl font-bold text-(--kt-ink)">Mantenimiento del catálogo</h1>
        <p className="text-sm text-(--kt-ink-soft)">Solo para el super admin. Borra y vuelve a cargar el catálogo del cliente con sus códigos y fotos.</p>
      </div>

      {estado.isPending ? <div className="rounded-2xl border border-slate-200 bg-white"><AdminSpinner /></div>
        : estado.isError ? (
          <div className="space-y-2">
            <ErrorBanner message={mensajeDeError(estado.error, "No pudimos leer el estado del catálogo.")} />
            <button type="button" className={SECUNDARIO} onClick={() => estado.refetch()}>Reintentar</button>
          </div>
        ) : (
          <>
            <section className="space-y-3" aria-label="Hoy en la base">
              <h2 className="font-bold text-(--kt-ink)">Hoy en la base</h2>
              <Cantidades e={e} />
            </section>

            <section className="space-y-3 rounded-2xl border border-red-200 bg-white p-4" aria-label="Limpiar artículos">
              <h2 className="flex items-center gap-2 font-bold text-red-700"><AlertTriangle size={18} /> 1. Limpiar artículos</h2>
              <p className="text-sm text-slate-600">Antes, bajá una copia (código, nombre, categoría, precio y foto de cada artículo) y hacé un respaldo de la base en Supabase.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={SECUNDARIO} disabled={copia.isPending || e.presentaciones === 0} onClick={bajarCopia}><Download size={16} /> {copia.isPending ? "Preparando…" : "Descargar copia (CSV)"}</button>
                <button type="button" disabled={e.articulos === 0 && e.categorias === 0 && e.marcas === 0 || carga.cargando} onClick={() => setLimpiando(true)}
                  className={`${BOTON} bg-red-600 text-white hover:bg-red-700`}><Trash2 size={16} /> Limpiar artículos…</button>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Cargar catálogo del cliente">
              <h2 className="flex items-center gap-2 font-bold text-(--kt-ink)"><PackagePlus size={18} /> 2. Cargar catálogo del cliente</h2>
              <p className="text-sm text-slate-600">
                {numero(e.catalogo.articulos)} artículos del Listado del cliente ({numero(e.catalogo.conFoto)} con foto). Entran <b>ocultos y en $0</b>:
                se ven en la tienda cuando "Actualizar precios" les pone precio.
              </p>
              {!e.puedeCargar && !terminada && (
                <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm">
                  {e.catalogo.articulos === 0 ? "No está el archivo del catálogo del cliente en el sistema." : "Ya hay artículos cargados: para cargar de nuevo, primero limpiá."}
                </p>
              )}
              {carga.error && <ErrorBanner message={carga.error} />}
              {(carga.cargando || carga.progreso) && !terminada && (
                <p role="status" className="text-sm font-semibold">Cargando… lote {numero(carga.progreso?.siguiente_lote ?? 0)} de {numero(carga.progreso?.total_lotes ?? e.carga?.total_lotes ?? "…")}</p>
              )}
              {terminada && (
                <div role="status" className="space-y-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p>Listo: {numero(carga.progreso.resultado.articulos)} artículos, {numero(carga.progreso.resultado.categorias)} categorías y {numero(carga.progreso.resultado.fotos)} fotos.
                    {carga.progreso.resultado.errores ? ` ${numero(carga.progreso.resultado.errores)} filas no entraron.` : ""}</p>
                  <Link to="/distribuidora/admin/precios-cliente" className={`${BOTON} bg-(--kt-petrol) text-white`}>Siguiente: Actualizar precios</Link>
                </div>
              )}
              {!terminada && (
                <button type="button" disabled={!e.puedeCargar || carga.cargando} onClick={() => carga.cargar(e.carga?.siguiente_lote ?? carga.progreso?.siguiente_lote ?? 0)}
                  className={`${BOTON} bg-(--kt-petrol) text-white hover:bg-(--kt-night)`}>
                  <PackagePlus size={16} /> {carga.cargando ? "Cargando…" : e.carga || carga.error ? "Continuar la carga" : "Cargar catálogo del cliente"}
                </button>
              )}
            </section>
          </>
        )}
      {limpiando && <LimpiarModal onClose={() => setLimpiando(false)} />}
    </div>
  );
}
