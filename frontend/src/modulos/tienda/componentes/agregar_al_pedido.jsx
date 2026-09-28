import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import { useCarrito } from "../hooks/use_carrito.js";
import SelectorCantidad from "./selector_cantidad.jsx";

/** Acción del detalle de producto (la aporta el módulo tienda al catálogo). */
export default function AgregarAlPedido({ variante }) {
  const toast = useToast();
  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const sinStock = variante?.disponibilidad === "sin_stock";

  async function alAgregar() {
    setEnviando(true);
    try {
      await agregar(variante.id, cantidad);
      setAgregado(true);
      toast.exito(`Agregado al pedido (${cantidad})`);
      setCantidad(1);
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SelectorCantidad valor={cantidad} onCambiar={setCantidad} deshabilitado={sinStock || enviando} />
        <Boton onClick={alAgregar} disabled={!variante || sinStock || enviando}>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" /> {sinStock ? "Sin stock" : enviando ? "Agregando..." : "Agregar al pedido"}
        </Boton>
      </div>
      {agregado && (
        <Link to="/carrito" className="inline-block text-sm font-semibold text-primario hover:underline">
          Ver mi pedido →
        </Link>
      )}
    </div>
  );
}
