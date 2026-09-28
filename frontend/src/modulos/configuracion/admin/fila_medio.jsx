import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import LogosMedios from "@/componentes/pagos/logos_medios.jsx";
import { LOGOS } from "@/componentes/pagos/logos.js";
import InputField from "@/componentes/ui/input_field.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import Interruptor from "@/componentes/ui/interruptor.jsx";
import { cn } from "@/utils/cn.js";
import { LOGOS_TARJETAS } from "../utils/formulario_pagos.js";

function DatosTransferencia() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const e = errors.datos_transferencia ?? {};
  return (
    <fieldset className="rounded-xl bg-fondo p-4">
      <legend className="sr-only">Cuenta para recibir transferencias</legend>
      <p className="text-sm font-semibold">Cuenta donde te transfieren</p>
      {e.message && (
        <p role="alert" className="mt-1 text-sm text-peligro">
          {e.message}
        </p>
      )}
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <InputField label="CBU" name="datos_transferencia.cbu" register={register} error={e.cbu?.message} inputMode="numeric" maxLength={26} required ayuda="22 números. Se revisa que no tenga errores de tipeo." />
        <InputField label="Alias" name="datos_transferencia.alias" register={register} error={e.alias?.message} placeholder="MI.TIENDA.PAGOS" />
        <InputField label="Titular" name="datos_transferencia.titular" register={register} error={e.titular?.message} required />
        <InputField label="CUIT (opcional)" name="datos_transferencia.cuit" register={register} error={e.cuit?.message} placeholder="30-12345678-9" />
        <InputField label="Banco (opcional)" name="datos_transferencia.banco" register={register} error={e.banco?.message} />
      </div>
    </fieldset>
  );
}

function TarjetasAceptadas({ indice }) {
  const { register } = useFormContext();
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Tarjetas que aceptás</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {LOGOS_TARJETAS.map((clave) => (
          <label key={clave} className="flex cursor-pointer items-center gap-2 rounded-lg border border-borde px-2 py-1 text-sm has-[:checked]:border-primario has-[:checked]:bg-primario/5">
            <input type="checkbox" value={clave} className="h-4 w-4 accent-[var(--primario)]" {...register(`medios.${indice}.logos`)} />
            <img src={LOGOS[clave].src} alt="" className="h-5 w-8 object-contain" />
            {LOGOS[clave].nombre}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Una fila por medio: interruptor + resumen; "Editar" abre solo lo que corresponde a ese medio. */
export default function FilaMedio({ indice }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const medio = useWatch({ control, name: `medios.${indice}` });
  const cuenta = useWatch({ control, name: "datos_transferencia" });
  const e = errors.medios?.[indice];
  const errorTransferencia = medio.valor === "transferencia" && errors.datos_transferencia;
  const [abierta, setAbierta] = useState(false);
  // Si hay un error adentro, se abre sola para que se vea.
  const visible = abierta || Boolean(e) || Boolean(errorTransferencia);
  const descuento = Number(medio.descuento) || 0;

  return (
    <li className={cn("rounded-xl border", medio.en_tienda ? "border-borde bg-superficie" : "border-dashed border-borde bg-fondo")}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Interruptor label={`Ofrecer ${medio.etiqueta}`} ocultarLabel name={`medios.${indice}.en_tienda`} register={register} />
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold", !medio.en_tienda && "text-texto-suave")}>{medio.etiqueta || "(sin nombre)"}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-texto-suave">
            {!medio.en_tienda && <span>No se ofrece</span>}
            {descuento > 0 && <Insignia tono="exito">{descuento}% OFF</Insignia>}
            {medio.valor === "transferencia" && (
              <span className={cn(!cuenta?.cbu && medio.en_tienda && "font-semibold text-peligro")}>
                {cuenta?.alias ? `Alias ${cuenta.alias}` : cuenta?.cbu ? `CBU ${cuenta.cbu}` : "Falta cargar el CBU"}
              </span>
            )}
            <LogosMedios logos={Array.isArray(medio.logos) ? medio.logos : []} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={visible}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-primario hover:bg-primario/10"
        >
          {visible ? "Cerrar" : "Editar"} <span className="sr-only">{medio.etiqueta}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", visible && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {visible && (
        <div className="space-y-4 border-t border-borde p-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <InputField label="Nombre que ve el cliente" name={`medios.${indice}.etiqueta`} register={register} error={e?.etiqueta?.message} required />
            <InputField label="Descuento (%)" name={`medios.${indice}.descuento`} type="number" min={0} max={90} step="0.5" register={register} error={e?.descuento?.message} ayuda="0 = sin descuento" />
          </div>
          <InputField label="Aclaración (opcional)" name={`medios.${indice}.detalle`} register={register} error={e?.detalle?.message} />
          {medio.valor === "transferencia" && <DatosTransferencia />}
          {medio.valor === "tarjeta" && <TarjetasAceptadas indice={indice} />}
        </div>
      )}
    </li>
  );
}
