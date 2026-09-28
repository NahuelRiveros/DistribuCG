import { cn } from "@/utils/cn.js";
import { LOGOS } from "./logos.js";

/** Logos de tarjetas / billeteras. Una clave desconocida se ignora (no rompe la ficha). */
export default function LogosMedios({ logos = [], className = "" }) {
  const conocidos = logos.map((clave) => LOGOS[clave]).filter(Boolean);
  if (conocidos.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Tarjetas y billeteras aceptadas">
      {conocidos.map((l) => (
        <li key={l.nombre} className="flex h-8 w-12 items-center justify-center rounded-md border border-borde bg-white p-1">
          <img src={l.src} alt={l.nombre} title={l.nombre} loading="lazy" className="max-h-full max-w-full object-contain" />
        </li>
      ))}
    </ul>
  );
}
