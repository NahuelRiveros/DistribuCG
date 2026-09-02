import { ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCarritoDistribuidora } from "./carrito_context.jsx";
import { projectModules } from "../../../config/gate_config.js";

export default function CarritoDistribuidoraIcon() {
  const { cantidadItems } = useCarritoDistribuidora();

  if (!projectModules.eccomerce_distribuidora) return null;

  return (
    <NavLink
      to="/distribuidora/carrito"
      aria-label="Ver mi pedido"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-(--kt-turquoise-soft)"
    >
      <ShoppingBag size={20} className="text-(--kt-ink)" />
      {cantidadItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--kt-teal-700) px-0.5 text-[9px] font-black text-white">
          {cantidadItems > 99 ? "99+" : cantidadItems}
        </span>
      )}
    </NavLink>
  );
}
