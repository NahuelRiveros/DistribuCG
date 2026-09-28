import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn.js";
import { useResumenStock } from "../hooks/use_stock.js";

function Tarjeta({ icono: Icono, titulo, valor, a, alerta }) {
  return (
    <Link to={a} className="flex items-center gap-4 rounded-2xl border border-borde bg-superficie p-5 transition hover:border-primario">
      <span className={cn("rounded-xl p-3", alerta ? "bg-peligro/10 text-peligro" : "bg-primario/10 text-primario")}>
        <Icono className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-bold">{valor ?? "—"}</span>
        <span className="text-sm text-texto-suave">{titulo}</span>
      </span>
    </Link>
  );
}

/** Tarjetas del stock para el inicio del panel. */
export default function ResumenStock() {
  const { data } = useResumenStock();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tarjeta icono={PackageX} titulo="Sin stock" valor={data?.sin_stock} a="/admin/stock?estado=sin_stock" alerta={data?.sin_stock > 0} />
      <Tarjeta icono={AlertTriangle} titulo="Stock bajo" valor={data?.bajo} a="/admin/stock?estado=bajo" alerta={data?.bajo > 0} />
      <Tarjeta icono={Boxes} titulo="Con control de stock" valor={data?.controladas} a="/admin/stock?estado=controlados" />
    </div>
  );
}
