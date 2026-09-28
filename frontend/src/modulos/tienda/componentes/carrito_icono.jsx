import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCarrito } from "../hooks/use_carrito.js";

/** Ícono del navbar con la cantidad de productos del pedido en curso. */
export default function CarritoIcono() {
  const { carrito } = useCarrito();
  const cantidad = carrito.items.length;
  return (
    <Link to="/carrito" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-fondo" aria-label={`Mi pedido: ${cantidad} producto(s)`}>
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {cantidad > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-xs font-bold text-white">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </Link>
  );
}
