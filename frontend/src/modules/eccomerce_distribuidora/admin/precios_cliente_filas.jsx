import { useState } from "react";
import { CheckCheck } from "lucide-react";
import AdminSpinner from "../../../core/controls/ui/admin_spinner.jsx";
import ErrorBanner from "../../../core/controls/ui/error_banner.jsx";
import Pagination from "../../../core/controls/ui/pagination.jsx";
import SearchField from "../../../core/controls/ui/search_field.jsx";
import { useToast } from "../../../core/controls/toast/use_toast.js";
import { formatearPrecio } from "../utils/precio_iva.js";
import { useDecidir, useFilasPrecios, mensajeDeError } from "./use_precios_cliente.js";

const BOTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-50";
const MOTIVOS = { variacion: "Variación grande", nombre: "El nombre no se parece" };

function Variacion({ valor }) {
  if (valor == null) return null;
  const color = valor > 0 ? "bg-amber-50 text-amber-800" : valor < 0 ? "bg-sky-50 text-sky-800" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{valor > 0 ? "+" : ""}{String(valor).replace(".", ",")} %</span>;
}

function Decision({ fila, grupo, decidir, ocupado }) {
  // Se ve en el mismo clic; cuando llega la decisión guardada (o falla), manda la del servidor.
  const [local, setLocal] = useState(null);
  const decision = local && local.base === fila.decision ? local.valor : fila.decision;
  const elegir = (valor) => {
    const nuevo = decision === valor ? null : valor;
    setLocal({ valor: nuevo, base: fila.decision });
    decidir.mutate({ decisiones: { [fila.cod]: nuevo } }, () => setLocal(null));
  };
  if (grupo.estado === "repetido") {
    return (
      <fieldset className="mt-2 space-y-1" disabled={ocupado}>
        <legend className="text-xs font-semibold text-slate-600">¿Cuál vale?</legend>
        {fila.opciones.map((o, i) => (
          <label key={i} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-checked:border-(--kt-teal-700) has-checked:bg-teal-50">
            <input type="radio" name={"op-" + fila.cod} checked={decision === "opcion:" + i} onChange={() => elegir("opcion:" + i)} />
            <span className="font-semibold">{o.precio > 0 ? formatearPrecio(o.precio) : "Sin precio"}</span>
            <span className="min-w-0 flex-1 break-words text-slate-600">{o.descripcion} <span className="text-xs text-slate-400">({o.origen}, fila {o.fila})</span></span>
          </label>
        ))}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-checked:border-slate-500 has-checked:bg-slate-50">
          <input type="radio" name={"op-" + fila.cod} checked={decision === "excluir"} onChange={() => elegir("excluir")} />
          No tocar este artículo
        </label>
      </fieldset>
    );
  }
  return (
    <div className="mt-2 flex gap-2">
      <button type="button" aria-pressed={decision === "aprobar"} disabled={ocupado} onClick={() => elegir("aprobar")}
        className={`${BOTON} border ${decision === "aprobar" ? "border-(--kt-teal-700) bg-(--kt-teal-700) text-white" : "border-slate-300 bg-white text-slate-700"}`}>Aprobar</button>
      <button type="button" aria-pressed={decision === "excluir"} disabled={ocupado} onClick={() => elegir("excluir")}
        className={`${BOTON} border ${decision === "excluir" ? "border-slate-600 bg-slate-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Excluir</button>
    </div>
  );
}

function Fila({ fila, grupo, decidir, puedeDecidir }) {
  const conPrecio = fila.precioAntes != null && fila.precioNuevo != null && fila.estado !== "repetido";
  return (
    <li className="px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="min-w-0 sm:flex-1">
          <p className="break-words text-sm font-semibold text-(--kt-ink)"><span className="font-mono text-xs text-slate-500">{fila.cod}</span> · {fila.articulo || fila.descripcion}</p>
          {fila.articulo && fila.descripcion && <p className="break-words text-xs text-slate-500">En la lista: {fila.descripcion}</p>}
          {fila.mensaje && <p className="text-xs text-slate-500">{fila.mensaje}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {conPrecio && fila.precioNuevo !== fila.precioAntes && <><span className="text-slate-400 line-through">{formatearPrecio(fila.precioAntes)}</span><span aria-hidden="true">→</span></>}
          {conPrecio && <span className="font-semibold">{formatearPrecio(fila.precioNuevo)}</span>}
          {!conPrecio && fila.precioLista > 0 && <span className="font-semibold">{formatearPrecio(fila.precioLista)}</span>}
          {!conPrecio && fila.precioAntes != null && fila.estado === "no_figura" && <span>{formatearPrecio(fila.precioAntes)}</span>}
          <Variacion valor={fila.variacion} />
        </div>
      </div>
      {(fila.motivos?.length > 0 || fila.origen === "Datos Exportados") && (
        <p className="mt-1 flex flex-wrap gap-1">
          {fila.motivos?.map((m) => <span key={m} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{MOTIVOS[m]}</span>)}
          {fila.origen === "Datos Exportados" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Precio de Datos Exportados</span>}
        </p>
      )}
      {grupo.decide && puedeDecidir && <Decision fila={fila} grupo={grupo} decidir={decidir} ocupado={decidir.isPending} />}
    </li>
  );
}

/** Filas de un grupo de la vista previa (PRE-35), con las decisiones de PRE-36 y PRE-37. */
export default function PreciosClienteFilas({ id, grupo, puedeDecidir }) {
  const toast = useToast();
  const [pagina, setPagina] = useState(1);
  const [buscar, setBuscar] = useState("");
  const filas = useFilasPrecios(id, { estado: grupo.estado, pagina, buscar });
  const decidir = useDecidir(id);
  const decidirConAviso = { ...decidir, mutate: (cuerpo, alFallar) => decidir.mutate(cuerpo, { onError: (e) => { alFallar?.(); toast.error(mensajeDeError(e, "No se guardó la decisión. Reintentá.")); } }) };

  return (
    <section aria-label={grupo.titulo} className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-bold text-(--kt-ink)">{grupo.titulo}</h2>
          {grupo.ayuda && <p className="text-sm text-slate-600">{grupo.ayuda}</p>}
        </div>
        {grupo.estado === "revisar" && puedeDecidir && (
          <button type="button" disabled={decidir.isPending} onClick={() => decidirConAviso.mutate({ aprobarTodos: true })}
            className={`${BOTON} border border-(--kt-teal-700) bg-white text-(--kt-teal-700)`}><CheckCheck size={16} /> Aprobar todos</button>
        )}
      </div>
      <div className="px-4 pt-3">
        <SearchField label="Buscar en este grupo" placeholder="Código o nombre…" value={buscar} onSearch={(v) => { setBuscar(v); setPagina(1); }} />
      </div>
      {filas.isPending ? <AdminSpinner />
        : filas.isError ? (
          <div className="space-y-2 p-4">
            <ErrorBanner message={mensajeDeError(filas.error, "No pudimos cargar las filas.")} />
            <button type="button" onClick={() => filas.refetch()} className={`${BOTON} border border-slate-300 bg-white`}>Reintentar</button>
          </div>
        ) : filas.data.total === 0 ? <p className="p-4 text-sm text-slate-500">{buscar ? "Nada coincide con la búsqueda." : "No hay filas en este grupo."}</p>
          : (
            <>
              <ul className="divide-y divide-slate-100">
                {filas.data.filas.map((f) => <Fila key={f.cod + (f.variedadId ?? "")} fila={f} grupo={grupo} decidir={decidirConAviso} puedeDecidir={puedeDecidir} />)}
              </ul>
              <Pagination page={filas.data.pagina} pages={filas.data.paginas} total={filas.data.total} onChange={setPagina} disabled={filas.isFetching} />
            </>
          )}
    </section>
  );
}
