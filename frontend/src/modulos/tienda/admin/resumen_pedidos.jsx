import { ClipboardList, PackageOpen, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn.js";
import { useResumenPedidos } from "../hooks/use_tienda.js";

function Tarjeta({ icono: Icono, titulo, valor, a, destacar }) {
  return (
    <Link to={a} className="flex items-center gap-4 rounded-2xl border border-borde bg-superficie p-5 transition hover:border-primario">
      <span className={cn("rounded-xl p-3", destacar ? "bg-acento/15 text-acento" : "bg-primario/10 text-primario")}>
        <Icono className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-bold">{valor ?? "—"}</span>
        <span className="text-sm text-texto-suave">{titulo}</span>
      </span>
    </Link>
  );
}

export default function ResumenPedidos() {
  const { data } = useResumenPedidos();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Tarjeta icono={ClipboardList} titulo="Pedidos nuevos" valor={data?.nuevos} a="/admin/pedidos?estado=pendiente" destacar={data?.nuevos > 0} />
      <Tarjeta icono={PackageOpen} titulo="En preparación" valor={data?.en_preparacion} a="/admin/pedidos?estado=en_preparacion" />
      <Tarjeta icono={Wallet} titulo="Por cobrar" valor={data?.por_cobrar} a="/admin/pedidos?estado_cobro=pendiente" />
    </div>
  );
}
