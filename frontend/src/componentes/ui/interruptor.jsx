import { useId } from "react";

/** Casilla con forma de interruptor (encendido / apagado). Es un checkbox real: funciona con teclado y con register. */
export default function Interruptor({ label, name, register, ocultarLabel = false, ...resto }) {
  const id = `${name}-${useId()}`;
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input id={id} type="checkbox" role="switch" className="peer sr-only" {...(register ? register(name) : { name })} {...resto} />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full bg-borde transition peer-checked:bg-primario peer-focus-visible:ring-2 peer-focus-visible:ring-primario peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
      />
      <span className={ocultarLabel ? "sr-only" : "font-medium"}>{label}</span>
    </label>
  );
}
