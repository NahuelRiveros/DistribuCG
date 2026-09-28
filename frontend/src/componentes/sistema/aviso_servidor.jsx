import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudOff, LoaderCircle } from "lucide-react";
import { verificarServidor } from "@/api/salud_api.js";

// En Render (plan gratis) el servidor se duerme sin visitas y tarda ~30-50 s en despertar:
// si la primera respuesta demora más que esto, avisamos en vez de dejar la página "colgada".
const DEMORA_AVISO_MS = 3000;
const REINTENTO_MS = 5000;

/** Aviso chico abajo de la pantalla cuando la API tarda en despertar o no responde. No bloquea la página. */
export default function AvisoServidor() {
  const salud = useQuery({
    queryKey: ["salud"],
    queryFn: verificarServidor,
    retry: false,
    staleTime: 60_000,
    // Solo se insiste mientras está caído; con el servidor bien no hay consultas de más.
    refetchInterval: (query) => (query.state.status === "error" ? REINTENTO_MS : false),
  });
  const [demora, setDemora] = useState(false);

  useEffect(() => {
    if (!salud.isPending) return;
    const id = setTimeout(() => setDemora(true), DEMORA_AVISO_MS);
    return () => clearTimeout(id);
  }, [salud.isPending]);

  const caido = salud.isError;
  const despertando = salud.isPending && demora;
  if (!caido && !despertando) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-borde bg-superficie p-4 shadow-xl"
    >
      {caido ? (
        <CloudOff className="h-6 w-6 shrink-0 text-peligro" aria-hidden="true" />
      ) : (
        <LoaderCircle className="h-6 w-6 shrink-0 animate-spin text-primario" aria-hidden="true" />
      )}
      <div className="text-sm">
        <p className="font-semibold">{caido ? "Sin conexión con el servidor" : "Despertando el servidor…"}</p>
        <p className="text-texto-suave">
          {caido ? "Revisá tu conexión. Reintentamos solos cada pocos segundos." : "La primera carga puede tardar unos segundos."}
        </p>
      </div>
    </div>
  );
}
