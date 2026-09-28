import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn.js";

const CAMPOS = [
  { clave: "cbu", etiqueta: "CBU", copiable: true },
  { clave: "alias", etiqueta: "Alias", copiable: true },
  { clave: "titular", etiqueta: "Titular" },
  { clave: "cuit", etiqueta: "CUIT" },
  { clave: "banco", etiqueta: "Banco" },
];

function Copiar({ texto, etiqueta }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el dato igual está a la vista para copiarlo a mano.
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
      className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", copiado ? "text-emerald-700" : "text-primario hover:bg-primario/10")}
    >
      {copiado ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

/** CBU, alias y titular para transferir (`datos` = pagos.datos_transferencia), con botón de copiar. */
export default function DatosTransferencia({ datos, titulo = "Datos para transferir", className = "" }) {
  if (!datos?.cbu && !datos?.alias) return null;

  return (
    <section className={cn("rounded-xl border border-borde bg-fondo p-4", className)} aria-label={titulo}>
      <p className="text-sm font-semibold">{titulo}</p>
      <dl className="mt-2 space-y-1.5 text-sm">
        {CAMPOS.filter((c) => datos[c.clave]).map((c) => (
          <div key={c.clave} className="flex flex-wrap items-center justify-between gap-x-3">
            <dt className="text-texto-suave">{c.etiqueta}</dt>
            <dd className="flex items-center gap-1 font-medium">
              <span className={cn(c.clave === "cbu" && "break-all font-mono tracking-tight")}>{datos[c.clave]}</span>
              {c.copiable && <Copiar texto={datos[c.clave]} etiqueta={c.etiqueta} />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
