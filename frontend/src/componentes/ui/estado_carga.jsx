import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { mensajeDeError } from "@/api/http.js";
import Boton from "./boton.jsx";

// Los 3 estados que toda pantalla con datos tiene que mostrar (ver CLAUDE.md).

export function Cargando({ texto = "Cargando..." }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-texto-suave">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> {texto}
    </div>
  );
}

export function ErrorCarga({ error, onReintentar }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-peligro/30 bg-peligro/5 px-4 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-peligro" aria-hidden="true" />
      <p className="text-sm text-texto">{mensajeDeError(error, "No pudimos cargar la información.")}</p>
      {onReintentar && (
        <Boton variante="secundario" tamano="chico" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}

export function Vacio({ titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde px-4 py-12 text-center">
      <Inbox className="h-8 w-8 text-texto-suave" aria-hidden="true" />
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-texto-suave">{texto}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
