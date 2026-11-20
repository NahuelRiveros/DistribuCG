import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import AdminSpinner from "../../../core/controls/ui/admin_spinner.jsx";
import ConfirmDialog from "../../../core/controls/ui/confirm_dialog.jsx";
import ErrorBanner from "../../../core/controls/ui/error_banner.jsx";
import { downloadBlob } from "../../../core/controls/importacion/download.js";
import { useToast } from "../../../core/controls/toast/use_toast.js";
import { GRUPOS_PRECIOS_CLIENTE, listaPreciosClienteConfig as config } from "../config/lista_precios_cliente_config.js";
import PreciosClienteFilas from "./precios_cliente_filas.jsx";
import BotonAyuda from "../../../core/modules/ayuda/boton_ayuda.jsx";
import {
  mensajeDeError, useActualizacionPrecios, useAplicarLotes, useCancelarActualizacion, useDeshacerActualizacion,
  useHistorialPrecios, useInforme, useValidarLista,
} from "./use_precios_cliente.js";

const BOTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50";
const PRIMARIO = `${BOTON} bg-(--kt-petrol) text-white hover:bg-(--kt-night)`;
const SECUNDARIO = `${BOTON} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
const ESTADOS = { validado: "Sin aplicar", procesando: "A medio aplicar", completado: "Aplicada", deshecho: "Deshecha", cancelado: "Descartada" };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const fecha = (iso) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

function SubirLista({ onLista }) {
  const [archivo, setArchivo] = useState(null);
  const clave = useRef(null);
  const validar = useValidarLista();
  const elegir = (e) => { setArchivo(e.target.files?.[0] ?? null); clave.current = crypto.randomUUID(); validar.reset(); };
  const leer = () => validar.mutate({ archivo, key: clave.current }, { onSuccess: onLista });
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Subir la lista">
      <h2 className="font-bold text-(--kt-ink)">1. Subí la lista de precios</h2>
      <p className="text-sm text-slate-600">
        El Excel que exporta el sistema ("LISTA DE PRECIOS"). Se lee la hoja <b>{config.hojaPrincipal}</b> y se compara con
        <b> {config.hojaComparacion}</b>: si allá el precio es mayor, vale ese. Antes de cambiar nada vas a ver qué sube, qué baja y qué hay que revisar.
      </p>
      <label className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm hover:bg-slate-50">
        <FileSpreadsheet size={20} className="text-slate-500" aria-hidden="true" />
        <span className="min-w-0 flex-1 break-all">{archivo ? archivo.name : "Elegir el archivo .xlsx"}</span>
        <input type="file" accept=".xlsx" className="sr-only" onChange={elegir} disabled={validar.isPending} />
      </label>
      {validar.isError && <ErrorBanner message={mensajeDeError(validar.error, "No pudimos leer la lista. Revisá el archivo y reintentá.")} />}
      <button type="button" className={PRIMARIO} disabled={!archivo || validar.isPending} onClick={leer}>
        <Upload size={16} /> {validar.isPending ? "Leyendo la lista…" : validar.isError ? "Reintentar" : "Leer la lista"}
      </button>
    </section>
  );
}

function Historial({ onAbrir }) {
  const historial = useHistorialPrecios();
  return (
    <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Actualizaciones anteriores">
      <h2 className="font-bold text-(--kt-ink)">Mis actualizaciones</h2>
      {historial.isPending ? <AdminSpinner />
        : historial.isError ? (
          <div className="space-y-2"><ErrorBanner message="No pudimos cargar las actualizaciones." />
            <button type="button" className={SECUNDARIO} onClick={() => historial.refetch()}>Reintentar</button></div>
        ) : historial.data.length === 0 ? <p className="text-sm text-slate-500">Todavía no subiste ninguna lista.</p>
          : (
            <ul className="divide-y divide-slate-100">
              {historial.data.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold">{h.archivo}</p>
                    <p className="text-xs text-slate-500">{fecha(h.creado_en)} · {ESTADOS[h.estado] ?? h.estado}{h.resultado?.precios ? ` · ${h.resultado.precios} precios` : ""}</p>
                  </div>
                  <button type="button" className={SECUNDARIO} onClick={() => onAbrir(h.id)}>Ver</button>
                </li>
              ))}
            </ul>
          )}
    </section>
  );
}

function Tarjetas({ resumen, elegido, onElegir }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {GRUPOS_PRECIOS_CLIENTE.filter((g) => resumen[g.estado]).map((g) => (
        <button key={g.estado} type="button" aria-pressed={elegido === g.estado} onClick={() => onElegir(g.estado)}
          className={`min-h-11 rounded-xl border p-3 text-left ${elegido === g.estado ? "border-(--kt-petrol) bg-(--kt-petrol) text-white" : g.decide ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
          <span className="block text-2xl font-bold">{resumen[g.estado]}</span>
          <span className="block text-sm">{g.titulo}</span>
        </button>
      ))}
    </div>
  );
}

function VistaPrevia({ trabajo, lotes, onSalir }) {
  const toast = useToast();
  const primero = GRUPOS_PRECIOS_CLIENTE.find((g) => trabajo.resumen[g.estado] && g.decide) ?? GRUPOS_PRECIOS_CLIENTE.find((g) => trabajo.resumen[g.estado]);
  const [grupo, setGrupo] = useState(primero?.estado);
  const [ajustarListas, setAjustarListas] = useState(true);
  const [confirmar, setConfirmar] = useState(false);
  const [descartar, setDescartar] = useState(false);
  const { aplicar, aplicando, error } = lotes;
  const cancelar = useCancelarActualizacion(trabajo.id);
  const elegido = GRUPOS_PRECIOS_CLIENTE.find((g) => g.estado === grupo);
  const r = trabajo.resumen;
  const sinPrecio = (r.sin_precio ?? 0) + (r.desactivar ?? 0);

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Resumen">
        <h2 className="font-bold text-(--kt-ink)">2. Revisá los cambios</h2>
        <p className="text-sm text-slate-600 break-all">{trabajo.archivo} · leída el {fecha(trabajo.creado_en)}</p>
        {sinPrecio > 0 && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm text-slate-800"><b>{sinPrecio}</b> artículos de la tienda están en 0 en la lista (dejaron de venderse). Su precio no se toca.</p>}
        {r.debajo_costo > 0 && <p role="status" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <b>{r.debajo_costo} {r.debajo_costo === 1 ? "presentación quedaría" : "presentaciones quedarían"} por debajo del costo</b> (el precio de la lista no cubre el costo con IVA). Están marcadas en rojo; se pueden aplicar igual.
        </p>}
        <Tarjetas resumen={r} elegido={grupo} onElegir={setGrupo} />
      </section>

      {elegido && <PreciosClienteFilas id={trabajo.id} grupo={elegido} puedeDecidir={!aplicando} />}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Aplicar">
        <h2 className="font-bold text-(--kt-ink)">3. Aplicá la actualización</h2>
        {trabajo.pendientes > 0 && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {trabajo.pendientes === 1 ? "Falta" : "Faltan"} <b>{plural(trabajo.pendientes, "decisión", "decisiones")}</b>. Lo que no apruebes o elijas no se cambia.
          </p>
        )}
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={ajustarListas} onChange={(e) => setAjustarListas(e.target.checked)} disabled={aplicando} />
          <span>Ajustar también las <b>listas regionales</b> en el mismo porcentaje{r.listas_regionales ? ` (hasta ${plural(r.listas_regionales, "precio especial", "precios especiales")})` : " (ningún artículo con cambios tiene precio especial)"}.</span>
        </label>
        {error && <ErrorBanner message={error} />}
        {aplicando && <p role="status" className="text-sm font-semibold">Aplicando… lote {Math.min(trabajo.siguiente_lote + 1, trabajo.total_lotes)} de {trabajo.total_lotes}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={PRIMARIO} disabled={aplicando || cancelar.isPending} onClick={() => setConfirmar(true)}>{error ? "Continuar" : "Aplicar actualización"}</button>
          <button type="button" className={SECUNDARIO} disabled={aplicando || cancelar.isPending} onClick={() => setDescartar(true)}>Descartar</button>
        </div>
      </section>

      <ConfirmDialog open={confirmar} variant="primary" title="Aplicar la actualización"
        message={`Se cambian los precios aprobados${ajustarListas ? " y las listas regionales" : ""}. Si algo sale mal, se puede deshacer.`}
        confirmLabel="Aplicar" onClose={() => setConfirmar(false)} onConfirm={() => { setConfirmar(false); aplicar(trabajo, ajustarListas); }} />
      <ConfirmDialog open={descartar} variant="warning" title="Descartar esta lista" message="No se cambia nada. Podés volver a subirla cuando quieras."
        confirmLabel="Descartar" loading={cancelar.isPending} onClose={() => setDescartar(false)}
        onConfirm={() => cancelar.mutate(undefined, { onSuccess: () => { setDescartar(false); onSalir(); }, onError: (e) => toast.error(mensajeDeError(e, "No se pudo descartar.")) })} />
    </div>
  );
}

function Resultado({ trabajo, lotes, onSalir }) {
  const toast = useToast();
  const [deshacer, setDeshacer] = useState(false);
  const { aplicar, aplicando, error } = lotes;
  const desHacer = useDeshacerActualizacion(trabajo.id);
  const informe = useInforme(trabajo.id);
  const r = trabajo.resultado ?? {};
  const lineas = [
    ["Precios actualizados", r.precios], ["Artículos desactivados (sin precio hace más de " + config.mesesSinPrecio + " meses)", r.desactivados],
    ["Artículos que volvieron a la venta", r.reactivados], ["Precios de listas regionales ajustados", r.listas_regionales],
    ["No se tocaron porque cambiaron después de la vista previa", r.cambiados], ["Sin aprobar o excluidos", r.sin_aplicar],
  ].filter(([, n]) => n);
  const bajar = () => informe.mutate(undefined, {
    onSuccess: (blob) => downloadBlob(blob, `precios-${trabajo.fecha_lista ?? "lista"}.csv`),
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo descargar el informe.")),
  });

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Resultado">
      <h2 className="font-bold text-(--kt-ink)">{trabajo.estado === "procesando" ? "La actualización quedó a medias" : `Actualización ${ESTADOS[trabajo.estado]?.toLowerCase() ?? trabajo.estado}`}</h2>
      <p className="break-all text-sm text-slate-600">{trabajo.archivo} · {fecha(trabajo.creado_en)}</p>
      {trabajo.estado === "procesando" && (
        <div className="space-y-2">
          <p role="status" className="text-sm">Se aplicaron {trabajo.siguiente_lote} de {trabajo.total_lotes} lotes.{aplicando ? "" : " Continuá para terminarla."}</p>
          {error && <ErrorBanner message={error} />}
          <button type="button" className={PRIMARIO} disabled={aplicando} onClick={() => aplicar(trabajo, trabajo.ajustarListas ?? true)}>{aplicando ? "Aplicando…" : "Continuar"}</button>
        </div>
      )}
      {lineas.length > 0 ? (
        <ul className="space-y-1 text-sm">{lineas.map(([texto, n]) => <li key={texto}><b>{n}</b> · {texto}</li>)}</ul>
      ) : trabajo.estado === "completado" && <p className="text-sm">No hubo cambios para aplicar.</p>}
      {trabajo.estado === "deshecho" && r.deshacer && (
        <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm">
          Se volvieron atrás <b>{r.deshacer.revertidos}</b> artículos.
          {r.deshacer.no_revertidos > 0 && <> <b>{r.deshacer.no_revertidos}</b> no, porque alguien los cambió después: {r.deshacer.codigos_no_revertidos.join(", ")}.</>}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={SECUNDARIO} disabled={informe.isPending} onClick={bajar}>{informe.isPending ? "Preparando…" : "Descargar informe"}</button>
        {trabajo.puedeDeshacer && <button type="button" className={SECUNDARIO} onClick={() => setDeshacer(true)}><RotateCcw size={16} /> Deshacer</button>}
        <button type="button" className={PRIMARIO} onClick={onSalir}>Subir otra lista</button>
      </div>
      <ConfirmDialog open={deshacer} variant="warning" title="Deshacer la actualización"
        message="Vuelven los precios anteriores y el estado de los artículos. Lo que alguien cambió después se deja como está."
        confirmLabel="Deshacer" loading={desHacer.isPending} onClose={() => setDeshacer(false)}
        onConfirm={() => desHacer.mutate(undefined, { onSettled: () => setDeshacer(false), onError: (e) => toast.error(mensajeDeError(e, "No se pudo deshacer.")) })} />
    </section>
  );
}

/** Panel › Actualizar precios: la lista del sistema del cliente actualiza los precios (PRE-30 a PRE-39). */
export default function PreciosClientePage() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const trabajo = useActualizacionPrecios(id);
  // Acá y no en cada paso: al aplicar el primer lote la pantalla pasa al resultado y el ciclo tiene que seguir.
  const lotes = useAplicarLotes(id);
  const abrir = (nuevo) => setParams(nuevo ? { id: nuevo } : {});

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-6">
      <div>
        <div className="flex items-center gap-1"><h1 className="kt-display text-2xl font-bold text-(--kt-ink)">Actualizar precios</h1><BotonAyuda tema="actualizar-precios" /></div>
        <p className="text-sm text-(--kt-ink-soft)">Con la lista de precios que exporta el sistema. Solo cambia el precio de cada artículo, por su código.</p>
      </div>
      {!id ? (
        <>
          <SubirLista onLista={(t) => abrir(t.id)} />
          <Historial onAbrir={abrir} />
        </>
      ) : trabajo.isPending ? <div className="rounded-2xl border border-slate-200 bg-white"><AdminSpinner /></div>
        : trabajo.isError ? (
          <div className="space-y-2">
            <ErrorBanner message={mensajeDeError(trabajo.error, "No pudimos cargar la actualización.")} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={SECUNDARIO} onClick={() => trabajo.refetch()}>Reintentar</button>
              <button type="button" className={SECUNDARIO} onClick={() => abrir(null)}>Volver</button>
            </div>
          </div>
        ) : trabajo.data.estado === "validado" ? <VistaPrevia key={trabajo.data.id} trabajo={trabajo.data} lotes={lotes} onSalir={() => abrir(null)} />
          : <Resultado key={trabajo.data.id} trabajo={trabajo.data} lotes={lotes} onSalir={() => abrir(null)} />}
    </div>
  );
}
