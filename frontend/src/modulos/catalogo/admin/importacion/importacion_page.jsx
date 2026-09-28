import { useState } from "react";
import { RefreshCw } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";
import ConfirmDialog from "@/componentes/ui/confirm_dialog.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import { useAsistenteImportacion } from "./use_asistente_importacion.js";
import PasoArchivo from "./paso_archivo.jsx";
import PasoColumnas from "./paso_columnas.jsx";
import PasoRevision from "./paso_revision.jsx";

const ESTADOS = {
  validado: { etiqueta: "Revisada", tono: "aviso" },
  procesando: { etiqueta: "En curso", tono: "info" },
  completado: { etiqueta: "Terminada", tono: "exito" },
  cancelado: { etiqueta: "Cancelada", tono: "neutro" },
};

export default function ImportacionPage() {
  const asistente = useAsistenteImportacion();
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const deshabilitado = asistente.ocupado || asistente.ejecutando;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-5">
      <header>
        <h1 className="font-titulos text-2xl font-bold">Importar catálogo</h1>
        <p className="text-sm text-texto-suave">Cargá o actualizá muchos productos desde un Excel: primero se revisa todo, después se carga por partes.</p>
      </header>

      <FormError mensaje={asistente.error} />

      {asistente.importacion ? (
        <PasoRevision asistente={asistente} onCancelar={() => setConfirmarCancelar(true)} />
      ) : (
        <>
          <PasoArchivo asistente={asistente} deshabilitado={deshabilitado} />
          {asistente.vista && <PasoColumnas asistente={asistente} deshabilitado={deshabilitado} />}
        </>
      )}

      <section aria-labelledby="titulo-historial" className="space-y-3 rounded-2xl border border-borde bg-superficie p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-historial" className="font-bold">
            Mis últimas importaciones
          </h2>
          <Boton variante="fantasma" tamano="chico" onClick={asistente.actualizarHistorial} disabled={deshabilitado}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Actualizar
          </Boton>
        </div>
        <p className="text-sm text-texto-suave">El progreso queda guardado: si cerrás esta pantalla, podés volver y reanudar.</p>
        {asistente.historial.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay importaciones.</p>
        ) : (
          <ul className="divide-y divide-borde">
            {asistente.historial.map((imp) => (
              <li key={imp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold">{imp.archivo}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-texto-suave">
                    {new Date(imp.creado_en).toLocaleString("es-AR")}
                    <Insignia tono={ESTADOS[imp.estado].tono}>{ESTADOS[imp.estado].etiqueta}</Insignia>
                    {imp.siguiente_lote}/{imp.total_lotes} lotes
                  </p>
                </div>
                <Boton variante="secundario" tamano="chico" onClick={() => asistente.abrir(imp.id)} disabled={deshabilitado}>
                  Ver
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        abierto={confirmarCancelar}
        titulo="Cancelar importación"
        mensaje="Se detienen los lotes pendientes. Lo que ya se cargó se conserva."
        textoConfirmar="Cancelar importación"
        cargando={asistente.ocupado}
        onConfirmar={async () => {
          await asistente.cancelar();
          setConfirmarCancelar(false);
        }}
        onCerrar={() => setConfirmarCancelar(false)}
      />
    </div>
  );
}
