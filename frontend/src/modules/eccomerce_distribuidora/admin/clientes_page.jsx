import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Mail, MapPin, Phone, Users } from "lucide-react";
import { useAuth } from "../../../auth/auth_context.jsx";
import AdminSpinner from "../../../controls/ui/admin_spinner.jsx";
import AdminEmptyState from "../../../controls/ui/admin_empty_state.jsx";
import ErrorBanner from "../../../controls/ui/error_banner.jsx";
import SearchField from "../../../controls/ui/search_field.jsx";
import SelectField from "../../../controls/ui/select_field.jsx";
import Pagination from "../../../controls/ui/pagination.jsx";
import { tienePermiso } from "../../../../../permisos_config.js";
import { condicionIva } from "../../../../../fiscal_config.js";
import { getClientes } from "../api/clientes_api.js";

const BOTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

// CLI-11 a CLI-13: clientes con los datos que pide el primer pedido, para tenerlos a mano.
export default function ClientesPage() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const filtros = { q: params.get("q") || "", localidad: params.get("localidad") || "", pagina: Math.max(1, parseInt(params.get("pagina"), 10) || 1) };
  const clientes = useQuery({ queryKey: ["clientes-distribuidora", filtros], queryFn: () => getClientes(filtros), placeholderData: (previo) => previo });
  const verPedidos = tienePermiso(usuario, "pedidos.ver");
  function filtrar(clave, valor) {
    setParams((actual) => {
      const siguiente = new URLSearchParams(actual);
      if (valor) siguiente.set(clave, valor); else siguiente.delete(clave);
      if (clave !== "pagina") siguiente.delete("pagina");
      return siguiente;
    }, { replace: true });
  }
  const datos = clientes.data;
  const conFiltros = Boolean(filtros.q || filtros.localidad);

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Clientes</h1>
          <p className="mt-1 text-sm text-slate-600">Los clientes que ya completaron sus datos para pedir: contacto, facturación y entrega.</p>
        </div>
        <div className="grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <SearchField value={filtros.q} onSearch={(q) => filtrar("q", q)} label="Buscar clientes" placeholder="Nombre, razón social, CUIT/DNI o email" />
          <SelectField name="localidad" label="Localidad" placeholder="Todas las localidades" value={filtros.localidad}
            onChange={(e) => filtrar("localidad", e.target.value)} options={(datos?.localidades ?? []).map((l) => ({ value: l, label: l }))} />
        </div>

        {clientes.isPending ? <AdminSpinner />
          : clientes.isError ? (
            <div className="space-y-2">
              <ErrorBanner message={clientes.error.response?.data?.mensaje || "No pudimos cargar los clientes."} />
              <button type="button" onClick={() => clientes.refetch()} className={`${BOTON} border border-slate-300 bg-white`}>Reintentar</button>
            </div>
          ) : datos.data.length === 0 ? (
            <AdminEmptyState icon={Users}
              title={conFiltros ? "No hay clientes con estos filtros." : "Todavía no hay clientes con los datos completos."}
              description={conFiltros ? undefined : "Aparecen acá cuando completan sus datos para enviar su primer pedido."} />
          ) : (
            <>
              <p className="text-sm text-slate-500" role="status">{datos.total} {datos.total === 1 ? "cliente" : "clientes"}</p>
              <ul className="grid gap-3 md:grid-cols-2" aria-label="Listado de clientes">
                {datos.data.map((c) => <ClienteCard key={c.usuario_id} cliente={c} verPedidos={verPedidos} />)}
              </ul>
              <Pagination page={datos.page} pages={datos.totalPages} total={datos.total} disabled={clientes.isFetching} onChange={(p) => filtrar("pagina", String(p))} />
            </>
          )}
      </div>
    </main>
  );
}

function ClienteCard({ cliente: c, verPedidos }) {
  const nombre = `${c.nombre} ${c.apellido}`;
  const direccion = [c.direccion, c.localidad, c.provincia].filter(Boolean).join(", ");
  const pedidos = `${c.cantidad_pedidos} ${c.cantidad_pedidos === 1 ? "pedido" : "pedidos"}`;
  const enlace = `/distribuidora/admin/notas-pedido?${new URLSearchParams({ cliente: String(c.usuario_id), cliente_nombre: nombre })}`;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h2 className="font-bold text-slate-900">{nombre}</h2>
        {c.razon_social && <p className="text-sm text-slate-600">{c.razon_social}</p>}
        <p className="mt-1 text-xs text-slate-500">{condicionIva(c.condicion_iva)?.label ?? c.condicion_iva} · {c.cuit}</p>
      </div>
      <dl className="space-y-1.5 text-sm text-slate-700">
        <div className="flex items-start gap-2"><dt className="sr-only">Celular</dt><Phone aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-slate-400" /><dd><a className="underline-offset-2 hover:underline" href={`tel:${c.celular.replace(/[^\d+]/g, "")}`}>{c.celular}</a></dd></div>
        {c.email && <div className="flex items-start gap-2"><dt className="sr-only">Email</dt><Mail aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-slate-400" /><dd className="min-w-0 break-all"><a className="underline-offset-2 hover:underline" href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
        <div className="flex items-start gap-2"><dt className="sr-only">Dirección</dt><MapPin aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-slate-400" /><dd>{direccion}{c.codigo_postal ? ` (${c.codigo_postal})` : ""}</dd></div>
      </dl>
      <div className="mt-auto border-t border-slate-100 pt-3">
        {verPedidos && c.cantidad_pedidos > 0
          ? <Link to={enlace} className={`${BOTON} w-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 sm:w-auto`}><ClipboardList aria-hidden="true" size={16} />Ver sus {pedidos}</Link>
          : <p className="text-sm text-slate-500">{c.cantidad_pedidos > 0 ? pedidos : "Todavía sin pedidos"}</p>}
      </div>
    </li>
  );
}
