import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import LogosMedios from "@/componentes/pagos/logos_medios.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import InputField from "@/componentes/ui/input_field.jsx";
import Interruptor from "@/componentes/ui/interruptor.jsx";
import { cn } from "@/utils/cn.js";
import { PROVEEDORES_CUOTAS } from "../utils/formulario_pagos.js";
import EditorPagos from "./editor_pagos.jsx";

const PLAN_NUEVO = { cuotas: 3, interes: 0, cft: "", activo: true };

/** Un plan en una línea: "3 cuotas · Sin interés". Con interés aparecen el % y el CFT (obligatorio por ley). */
function FilaPlan({ opcion, indice, onQuitar, puedeQuitar }) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext();
  const base = `financiacion.${opcion}.planes.${indice}`;
  const interes = useWatch({ control, name: `${base}.interes` });
  const [conInteres, setConInteres] = useState(Number(interes) > 0);
  const e = errors.financiacion?.[opcion]?.planes?.[indice] ?? {};

  function cambiarTipo(valor) {
    const con = valor === "con";
    setConInteres(con);
    if (!con) {
      setValue(`${base}.interes`, 0, { shouldDirty: true });
      setValue(`${base}.cft`, "", { shouldDirty: true });
    }
  }

  const campo = "rounded-lg border border-borde bg-superficie px-2 py-1.5 text-sm";
  const mensajes = [e.cuotas?.message, e.interes?.message, e.cft?.message].filter(Boolean);

  // Se lee como una frase: "[3] cuotas [Sin interés]" (+ recargo y CFT solo si es con interés).
  return (
    <li className="rounded-lg bg-fondo p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input type="number" min={1} max={60} aria-label="Cantidad de cuotas" aria-invalid={Boolean(e.cuotas)} className={cn(campo, "w-16 tabular-nums")} {...register(`${base}.cuotas`)} />
        <span>cuotas</span>
        <select aria-label="Tipo" value={conInteres ? "con" : "sin"} onChange={(ev) => cambiarTipo(ev.target.value)} className={campo}>
          <option value="sin">sin interés</option>
          <option value="con">con interés</option>
        </select>
        {conInteres && (
          <>
            <span className="text-texto-suave">recargo</span>
            <input type="number" min={0} step="0.5" aria-label="Recargo (%)" aria-invalid={Boolean(e.interes)} className={cn(campo, "w-20 tabular-nums")} {...register(`${base}.interes`)} />
            <span className="text-texto-suave">% · CFT</span>
            <input aria-label="CFT" placeholder="CFTEA 45,5 %" aria-invalid={Boolean(e.cft)} className={cn(campo, "w-36", e.cft && "border-peligro")} {...register(`${base}.cft`)} />
          </>
        )}
        <span className="ml-auto flex items-center gap-2">
          <Interruptor label="Activo" name={`${base}.activo`} register={register} />
          <Boton variante="fantasma" tamano="icono" onClick={onQuitar} disabled={!puedeQuitar} aria-label="Quitar este plan" title="Quitar plan">
            <Trash2 className="h-4 w-4 text-peligro" />
          </Boton>
        </span>
      </div>
      {mensajes.map((m) => (
        <p key={m} className="mt-1 text-sm text-peligro">
          {m}
        </p>
      ))}
    </li>
  );
}

function OpcionCuotas({ indice, onQuitar }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: `financiacion.${indice}.planes`, keyName: "clave" });
  const logos = useWatch({ control, name: `financiacion.${indice}.logos` });
  const e = errors.financiacion?.[indice] ?? {};

  return (
    <li className="rounded-xl border border-borde bg-superficie p-4">
      <div className="flex items-start gap-3">
        <LogosMedios logos={Array.isArray(logos) ? logos : []} className="mt-7 shrink-0" />
        <div className="flex-1">
          <InputField label="Nombre que ve el cliente" name={`financiacion.${indice}.nombre`} register={register} error={e.nombre?.message} required />
        </div>
        <Boton variante="fantasma" tamano="icono" className="mt-6" onClick={onQuitar} aria-label="Quitar esta forma de pago en cuotas" title="Quitar">
          <Trash2 className="h-4 w-4 text-peligro" />
        </Boton>
      </div>
      {e.planes?.root?.message && <p className="mt-2 text-sm text-peligro">{e.planes.root.message}</p>}
      <ul className="mt-3 space-y-2" aria-label="Planes de cuotas">
        {fields.map((plan, i) => (
          <FilaPlan key={plan.clave} opcion={indice} indice={i} onQuitar={() => remove(i)} puedeQuitar={fields.length > 1} />
        ))}
      </ul>
      <Boton variante="fantasma" tamano="chico" className="mt-2" onClick={() => append({ ...PLAN_NUEVO })}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Agregar otra cantidad de cuotas
      </Boton>
    </li>
  );
}

function ListaCuotas() {
  const { control, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "financiacion", keyName: "clave" });

  function agregar(proveedor) {
    // "Tarjeta de crédito" muestra las tarjetas elegidas en Medios de pago.
    const tarjetas = getValues("medios").find((m) => m.valor === "tarjeta")?.logos ?? [];
    append({ nombre: proveedor.nombre, medio: proveedor.medio, logos: proveedor.logos ?? tarjetas, planes: [{ ...PLAN_NUEVO }] });
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="agregar-cuotas" className="rounded-2xl border border-borde bg-superficie p-4">
        <h2 id="agregar-cuotas" className="text-sm font-semibold">
          Agregar cuotas con…
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROVEEDORES_CUOTAS.map((p) => (
            <Boton key={p.id} variante="secundario" tamano="chico" onClick={() => agregar(p)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {p.nombre}
            </Boton>
          ))}
        </div>
      </section>

      {fields.length === 0 ? (
        <p className={cn("rounded-2xl border border-dashed border-borde p-6 text-center text-sm text-texto-suave")}>
          No ofrecés cuotas. La ficha del producto dice “Por el momento no ofrecemos pago en cuotas”.
        </p>
      ) : (
        <ul className="space-y-4" aria-label="Formas de pago en cuotas">
          {fields.map((opcion, i) => (
            <OpcionCuotas key={opcion.clave} indice={i} onQuitar={() => remove(i)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CuotasPage() {
  return (
    <EditorPagos titulo="Cuotas" descripcion="Con qué se puede pagar en cuotas y cuántas. Pausá un plan con “Activo” sin borrarlo.">
      <ListaCuotas />
    </EditorPagos>
  );
}
