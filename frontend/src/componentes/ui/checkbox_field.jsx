import { useId } from "react";

export default function CheckboxField({ label, name, register, ayuda, ...resto }) {
  const id = `${name}-${useId()}`;
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primario)]" {...(register ? register(name) : { name })} {...resto} />
      <label htmlFor={id} className="text-sm">
        <span className="font-semibold">{label}</span>
        {ayuda && <span className="block text-texto-suave">{ayuda}</span>}
      </label>
    </div>
  );
}
