import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { getProducto } from "../api/producto_distribuidora_api.js";
import { useCarritoDistribuidora } from "../carrito/carrito_context.jsx";
import { storefrontConfig as config } from "../../../config/storefront_config.js";
import { formatearPrecio } from "../utils/precio_iva.js";
import QuantityInput from "../../../controls/ui/quantity_input.jsx";
import ActionButton from "../../../controls/ui/action_button.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import AdminSpinner from "../../../controls/ui/admin_spinner.jsx";
function Detail({ product }) {
  const { addItem } = useCarritoDistribuidora();
  const [variantId, setVariantId] = useState(() => product.variedades?.find((v) => !v.controla_stock || v.cantidad > 0)?.id ?? product.variedades?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const variant = product.variedades?.find((v) => v.id === variantId);
  const max = Math.min(config.maxQuantity, variant?.controla_stock ? variant.cantidad : config.maxQuantity);
  return <div className="grid gap-6 rounded-2xl border border-(--kt-border) bg-white p-4 sm:grid-cols-2 sm:p-6">
    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--kt-bg-soft)">
      {product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} className="h-full w-full object-contain p-4" /> : <Package size={48} />}
    </div>
    <div className="min-w-0 space-y-4">
      <div><p className="text-sm text-slate-500">{product.marca}</p><h1 className="kt-display text-2xl font-bold">{product.nombre}</h1></div>
      {product.descripcion && <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{product.descripcion}</p>}
      {!!product.variedades?.length && <fieldset><legend className="mb-2 text-sm font-bold">Presentación</legend><div className="flex flex-wrap gap-2">
        {product.variedades.map((v) => <button type="button" key={v.id} aria-pressed={variantId === v.id}
          onClick={() => { setVariantId(v.id); setQuantity(1); setAdded(false); setError(""); }}
          className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${variantId === v.id ? "border-(--kt-teal-700) bg-(--kt-turquoise-soft)" : "border-(--kt-border)"}`}>{v.nombre || "Unidad"}{v.controla_stock && v.cantidad <= 0 ? " · Sin stock" : ""}</button>)}
      </div></fieldset>}
      <div><p className="text-2xl font-extrabold">{variant ? formatearPrecio(variant.precio) : "Consultá disponibilidad"}</p><p className="text-xs text-slate-500">{config.labels.priceNotice}</p>
        <p className="mt-2 text-sm">{variant?.controla_stock ? max > 0 ? `${variant.cantidad} unidades disponibles` : "Sin stock" : config.labels.availability}</p>
        {variant?.cod_ref && <p className="text-xs text-slate-500">Código: {variant.cod_ref}</p>}
      </div>
      {variant && <div className="flex flex-wrap gap-3"><QuantityInput value={quantity} onChange={setQuantity} max={max} disabled={busy || max < 1} />
        <ActionButton disabled={busy || max < 1} onClick={async () => {
          setBusy(true); setError(""); setAdded(false);
          try { await addItem({ producto_id: product.id, variedad_id: variant.id, cantidad: quantity }); setAdded(true); }
          catch (e) { setError(e.response?.data?.mensaje || e.message); } finally { setBusy(false); }
        }}>{busy ? "Agregando…" : "Agregar al carrito"}</ActionButton></div>}
      <ErrorBanner message={error} />
      {added && <p role="status" className="text-sm text-emerald-700">Agregado. <Link to={config.cartPath} className="font-bold underline">Ver carrito</Link></p>}
      {!variant && <Link to="/#contacto" className="inline-block min-h-11 py-3 font-semibold underline">Consultar este producto</Link>}
    </div>
  </div>;
}
export default function ProductoDetalleDistribuidoraPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ["storefront", "product", id], queryFn: ({ signal }) => getProducto(id, { signal, publicAccess: config.publicCatalog }), staleTime: 30000 });
  return <div className="bg-(--kt-bg-soft) px-3 py-6 sm:px-6"><div className="mx-auto max-w-5xl space-y-4">
    <nav aria-label="Ubicación" className="flex flex-wrap gap-2 text-sm"><Link to={config.catalogPath} className="min-h-11 py-3 font-semibold underline">Productos</Link>
      {query.data?.categoria && <Link to={config.catalogPath + "?categoria=" + query.data.categoria.id} className="min-h-11 py-3">/ {query.data.categoria.nombre}</Link>}</nav>
    {query.isPending ? <AdminSpinner /> : query.isError ? <><ErrorBanner message={query.error.response?.status === 404 ? "Este producto ya no está disponible." : "No pudimos cargar el producto."} /><ActionButton onClick={() => query.refetch()}>Reintentar</ActionButton></> : <Detail key={id} product={query.data} />}
  </div></div>;
}
