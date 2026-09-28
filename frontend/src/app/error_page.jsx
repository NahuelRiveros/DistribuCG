import { useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";

// Después de publicar una versión nueva, una pestaña vieja puede pedir pantallas (lazy)
// que ya no existen. No es un error del usuario: con recargar se arregla.
const VERSION_VIEJA = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i;

/** Se muestra en lugar de la pantalla que falló (el navbar o el menú del panel siguen andando). */
export default function ErrorPage() {
  const error = useRouteError();
  const versionNueva = VERSION_VIEJA.test(error?.message ?? "");

  return (
    <section role="alert" className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <span className="rounded-full bg-peligro/10 p-3 text-peligro">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-titulos text-2xl font-bold">{versionNueva ? "Hay una versión nueva del sitio" : "Algo salió mal"}</h1>
      <p className="mt-2 text-texto-suave">
        {versionNueva
          ? "Actualizamos el sitio mientras lo tenías abierto. Recargá la página para seguir."
          : "Ocurrió un error inesperado en esta pantalla. Podés recargarla o volver al inicio."}
      </p>
      {import.meta.env.DEV && error?.message && !versionNueva && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-xl bg-fondo p-3 text-left text-xs text-peligro">{error.message}</pre>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Boton onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Recargar
        </Boton>
        <Boton variante="secundario" a="/">
          Ir al inicio
        </Boton>
      </div>
    </section>
  );
}
