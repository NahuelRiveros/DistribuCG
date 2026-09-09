import { useState } from "react";
import ProductCard from "../../../controls/catalog/product_card.jsx";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";
import { storefrontConfig as config } from "../../../config/storefront_config.js";
import { formatearPrecio } from "../utils/precio_iva.js";
export default function ProductoCard({ producto }) {
  const { addItem } = useCarritoDistribuidora();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const varieties = producto.variedades ?? [];
  const available = varieties.filter((v) => !v.controla_stock || v.cantidad > 0);
  const cheapest = [...(available.length ? available : varieties)].sort((a,b) => Number(a.precio) - Number(b.precio))[0];
  const single = varieties.length === 1;
  const add = async () => {
    setBusy(true); setError(""); setMessage("");
    try { await addItem({ producto_id: producto.id, variedad_id: varieties[0].id, cantidad: 1, producto }); setMessage("Agregado al carrito"); }
    catch (e) { setError(e.response?.data?.mensaje || e.message || "No se pudo agregar. Intentá nuevamente."); }
    finally { setBusy(false); }
  };
  return <ProductCard name={producto.nombre} brand={producto.marca} image={producto.imagen_url}
    to={config.catalogPath + "/" + producto.id}
    price={cheapest ? (single ? "" : "Desde ") + formatearPrecio(cheapest.precio) : "Consultá disponibilidad"}
    presentation={single ? varieties[0].nombre || "Unidad" : "Elegí una presentación"}
    availability={cheapest?.controla_stock ? available.length ? "Disponible · IVA incluido" : "Sin stock" : config.labels.availability}
    unavailable={!available.length} onAdd={single ? add : undefined} busy={busy} message={message} error={error} />;
}
