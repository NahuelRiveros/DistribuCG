import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Pencil } from "lucide-react";
import { proyecto } from "compartido/proyecto.js";
import { mediosTienda, totalConMedio } from "compartido/reglas/pagos.js";
import LogosMedios from "@/componentes/pagos/logos_medios.jsx";
import { pagosKeys, usePagos } from "@/hooks/use_pagos.js";
import { mensajeDeError } from "@/api/http.js";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import Boton from "@/componentes/ui/boton.jsx";
import FormError from "@/componentes/ui/form_error.jsx";
import TextareaField from "@/componentes/ui/textarea_field.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { cn } from "@/utils/cn.js";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import { useCarrito } from "../hooks/use_carrito.js";
import { useEnviarPedido, useGuardarPerfil, usePerfil } from "../hooks/use_tienda.js";
import DatosEntregaForm from "../componentes/datos_entrega_form.jsx";
import Totales from "../componentes/totales.jsx";
import { verProductos } from "@/clientes/index.js";

const { modalidades_entrega } = proyecto.tienda;

function Paso({ numero, titulo, activo, hecho, children, onEditar }) {
  return (
    <section className={cn("rounded-2xl border bg-superficie p-5", activo ? "border-primario" : "border-borde")} aria-labelledby={`paso-${numero}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`paso-${numero}`} className="flex items-center gap-2 text-lg font-bold">
          {hecho ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <span className="text-texto-suave">{numero}.</span>} {titulo}
        </h2>
        {hecho && onEditar && (
          <Boton variante="fantasma" tamano="chico" onClick={onEditar}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Cambiar
          </Boton>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

/** Envío del pedido en 2 pasos: datos de entrega → revisar y enviar. */
export default function ConfirmarPedidoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const perfil = usePerfil();
  const guardarPerfil = useGuardarPerfil();
  const { carrito, cargando, error, recargar } = useCarrito();
  const enviar = useEnviarPedido();
  const pagos = usePagos();
  const queryClient = useQueryClient();
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [modalidad, setModalidad] = useState(modalidades_entrega[0].valor);
  const [notas, setNotas] = useState("");
  // Sin valor inicial: el cliente elige a conciencia (el medio cambia el total).
  const [medio, setMedio] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState("");
  // Una clave por visita a esta pantalla: si el envío se repite (doble click, reintento), no se duplica.
  const [clave] = useState(() => crypto.randomUUID());

  if (perfil.isPending || cargando || pagos.isPending) return <Cargando />;
  if (perfil.isError || error || pagos.isError) {
    const reintentar = () => (perfil.isError ? perfil.refetch() : pagos.isError ? pagos.refetch() : recargar());
    return <ErrorCarga error={perfil.error ?? pagos.error ?? error} onReintentar={reintentar} />;
  }
  const MEDIOS = mediosTienda(pagos.data);
  if (carrito.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Tu pedido está vacío.</p>
        <Boton a="/catalogo" className="mt-4">
          {verProductos}
        </Boton>
      </div>
    );
  }

  const conDatos = Boolean(perfil.data) && !editandoDatos;

  const medioElegido = MEDIOS.find((m) => m.valor === medio);
  const conMedio = medioElegido ? totalConMedio(carrito.totales.total, medio, pagos.data) : { descuento: 0, total: carrito.totales.total, porcentaje: 0 };

  async function alEnviar() {
    setErrorEnvio("");
    if (!medioElegido) {
      setErrorEnvio("Elegí cómo vas a pagar.");
      return;
    }
    try {
      const pedido = await enviar.mutateAsync({
        clave,
        modalidad_entrega: modalidad,
        medio_pago: medio,
        descuento_esperado: medioElegido.descuento,
        notas,
        esperado: carrito.items.map((l) => ({ variante_id: l.variante_id, cantidad: l.cantidad, precio_final_unitario: l.precio_final_unitario })),
      });
      toast.exito("¡Pedido enviado! Te vamos a contactar para coordinar la entrega.");
      navigate(`/mis-pedidos/${pedido.id}`, { replace: true });
    } catch (e) {
      setErrorEnvio(mensajeDeError(e));
      // Si cambió un precio o el stock, se muestra el carrito actualizado para revisarlo.
      if (["CARRITO_CAMBIO", "CARRITO_CON_PROBLEMAS", "STOCK_INSUFICIENTE"].includes(e.response?.data?.codigo)) recargar();
      // Si cambió un descuento en el panel, se muestran los medios actualizados para confirmar de nuevo.
      if (e.response?.data?.codigo === "DESCUENTO_CAMBIO") queryClient.invalidateQueries({ queryKey: pagosKeys.publico });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 font-titulos text-3xl font-bold">Confirmar pedido</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Paso numero={1} titulo="Datos de entrega" activo={!conDatos} hecho={conDatos} onEditar={() => setEditandoDatos(true)}>
            {conDatos ? (
              <address className="text-sm not-italic text-texto-suave">
                {perfil.data.direccion}, {perfil.data.localidad}, {perfil.data.provincia} · Tel. {perfil.data.telefono}
              </address>
            ) : (
              <DatosEntregaForm
                perfil={perfil.data}
                textoBoton="Guardar y continuar"
                onGuardar={async (datos) => {
                  await guardarPerfil.mutateAsync(datos);
                  setEditandoDatos(false);
                }}
              />
            )}
          </Paso>

          <Paso numero={2} titulo="Revisar y enviar" activo={conDatos}>
            {conDatos && (
              <div className="space-y-4">
                <fieldset>
                  <legend className="text-sm font-semibold">¿Cómo recibís el pedido?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {modalidades_entrega.map((m) => (
                      <label key={m.valor} className={cn("cursor-pointer rounded-xl border px-4 py-2 text-sm", modalidad === m.valor ? "border-primario bg-primario/10 font-semibold text-primario" : "border-borde")}>
                        <input type="radio" name="modalidad" value={m.valor} checked={modalidad === m.valor} onChange={() => setModalidad(m.valor)} className="sr-only" />
                        {m.etiqueta}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold">¿Cómo vas a pagar?</legend>
                  <div className="mt-2 grid gap-2">
                    {MEDIOS.map((m) => (
                      <label
                        key={m.valor}
                        className={cn(
                          "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primario",
                          medio === m.valor ? "border-primario bg-primario/10" : "border-borde",
                        )}
                      >
                        <input type="radio" name="medio_pago" value={m.valor} checked={medio === m.valor} onChange={() => setMedio(m.valor)} className="sr-only" />
                        <span className={cn("font-medium", medio === m.valor && "font-semibold text-primario")}>{m.etiqueta}</span>
                        {m.descuento > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{m.descuento}% OFF</span>}
                        <LogosMedios logos={m.logos} className="ml-auto" />
                        {m.detalle && <span className="w-full text-xs text-texto-suave">{m.detalle}</span>}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <TextareaField label="Notas para el pedido (opcional)" name="notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={1000} />
                <ul className="divide-y divide-borde text-sm" aria-label="Productos a enviar">
                  {carrito.items.map((l) => (
                    <li key={l.variante_id} className="flex justify-between gap-3 py-2">
                      <span>
                        {l.cantidad} × {l.producto}
                        {l.presentacion ? ` (${l.presentacion})` : ""}
                        {l.mensaje && <span className="block text-peligro">{l.mensaje}</span>}
                      </span>
                      <span className="tabular-nums">{l.subtotal_final != null ? formatearDinero(l.subtotal_final) : "—"}</span>
                    </li>
                  ))}
                </ul>
                <FormError mensaje={errorEnvio} />
                <Boton className="w-full justify-center" onClick={alEnviar} disabled={enviar.isPending || !carrito.se_puede_enviar}>
                  {enviar.isPending ? "Enviando..." : "Enviar pedido"}
                </Boton>
                <p className="text-xs text-texto-suave">
                  Enviar el pedido no cobra nada: te contactamos para confirmar la entrega.
                  {medio === "transferencia" && " Al enviarlo te mostramos el CBU y el alias para transferir."}
                </p>
              </div>
            )}
          </Paso>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-borde bg-superficie p-5" aria-label="Resumen">
          <Totales
            subtotal_neto={carrito.totales.subtotal_neto}
            iva={carrito.totales.iva}
            descuento={conMedio.descuento}
            etiquetaDescuento={medioElegido ? `Descuento ${medioElegido.etiqueta.toLowerCase()} (${conMedio.porcentaje}%)` : undefined}
            total={conMedio.total}
          />
          <Link to="/carrito" className="block text-center text-sm font-semibold text-primario hover:underline">
            Modificar productos
          </Link>
        </aside>
      </div>
    </div>
  );
}
