import { Link } from "react-router-dom";
import { cn } from "@/utils/cn.js";

const VARIANTES = {
  primario: "bg-primario text-primario-texto hover:bg-primario-hover",
  secundario: "border border-borde bg-superficie text-texto hover:bg-fondo",
  peligro: "bg-peligro text-white hover:opacity-90",
  fantasma: "text-texto hover:bg-fondo",
};
const TAMANOS = {
  normal: "px-4 py-2.5 text-sm",
  chico: "px-3 py-1.5 text-sm",
  icono: "h-9 w-9 justify-center p-0",
};

/** Botón con estilos del tema. Con `a` se renderiza como link interno. */
export default function Boton({ variante = "primario", tamano = "normal", a, className = "", type = "button", children, ...resto }) {
  const clases = cn(
    "inline-flex items-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTES[variante],
    TAMANOS[tamano],
    className,
  );
  if (a) {
    return (
      <Link to={a} className={clases} {...resto}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={clases} {...resto}>
      {children}
    </button>
  );
}
