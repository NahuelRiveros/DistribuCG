import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { History } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";
import SubmitButton from "@/componentes/ui/submit_button.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { mensajeDeError } from "@/api/http.js";
import { useGuardarPagos, usePagosParaEditar } from "../hooks/use_configuracion.js";
import { aFormulario, formularioPagosSchema } from "../utils/formulario_pagos.js";
import VistaPreviaPagos from "./vista_previa_pagos.jsx";

const fechaHora = (f) => new Date(f).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
const nombre = (u) => (u ? [u.nombre, u.apellido].filter(Boolean).join(" ") : "—");

function Formulario({ datos, children }) {
  const toast = useToast();
  const guardar = useGuardarPagos();
  const [conflicto, setConflicto] = useState(false);
  const form = useForm({ resolver: zodResolver(formularioPagosSchema), defaultValues: aFormulario(datos.valor) });
  const { isDirty, isSubmitting } = form.formState;

  // `valor` ya viene normalizado y validado por el resolver: se envía tal cual.
  async function enviar(valor) {
    setConflicto(false);
    try {
      await guardar.mutateAsync({ valor, version: datos.version });
      toast.exito("Cambios guardados. La tienda ya los muestra.");
    } catch (error) {
      if (error.response?.data?.codigo === "CONFIGURACION_CAMBIO") setConflicto(true);
      else toast.error(mensajeDeError(error));
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(enviar, () => toast.error("Revisá los datos marcados en rojo."))} noValidate className="space-y-6">
        {children}
        <VistaPreviaPagos />

        {/* Barra fija abajo: siempre a mano */}
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-borde bg-superficie/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          {conflicto ? (
            <p role="alert" className="mr-auto text-sm text-peligro">
              Otra persona guardó cambios mientras editabas.{" "}
              <button type="button" className="font-semibold underline" onClick={() => window.location.reload()}>
                Recargar
              </button>
            </p>
          ) : (
            <span className="mr-auto text-sm text-texto-suave">{isDirty ? "Hay cambios sin guardar." : "Sin cambios."}</span>
          )}
          <Boton variante="secundario" onClick={() => form.reset(aFormulario(datos.valor))} disabled={!isDirty || isSubmitting}>
            Descartar
          </Boton>
          <SubmitButton cargando={isSubmitting} textoCargando="Guardando..." disabled={!isDirty}>
            Guardar cambios
          </SubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}

/**
 * Pestaña de Configuración de pagos (Medios de pago, Cuotas, Promociones). Las tres editan la misma
 * configuración: cada una muestra su parte y al guardar se guarda todo junto.
 */
export default function EditorPagos({ titulo, descripcion, children }) {
  const datos = usePagosParaEditar();
  const ultimo = datos.data?.historial[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-titulos text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-texto-suave">{descripcion}</p>
        {ultimo && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-texto-suave">
            <History className="h-3.5 w-3.5" aria-hidden="true" /> Último cambio: {nombre(ultimo.usuario)}, {fechaHora(ultimo.creado_en)}
          </p>
        )}
      </header>

      {datos.isPending ? (
        <Cargando texto="Cargando configuración..." />
      ) : datos.isError ? (
        <ErrorCarga error={datos.error} onReintentar={datos.refetch} />
      ) : (
        // key: al guardar cambia la versión y el formulario arranca de lo guardado
        <Formulario key={datos.data.version ?? "inicial"} datos={datos.data}>
          {children}
        </Formulario>
      )}
    </div>
  );
}
