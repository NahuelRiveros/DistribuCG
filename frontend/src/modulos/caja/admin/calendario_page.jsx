import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { hoyEn, MESES } from "compartido/reglas/fechas.js";
import Boton from "@/componentes/ui/boton.jsx";
import { Cargando, ErrorCarga } from "@/componentes/ui/estado_carga.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { useAnularMovimiento, useBalanceMes, useCategoriasCaja, useCrearMovimiento, useEditarMovimiento } from "../hooks/use_caja.js";
import AnularModal from "./anular_modal.jsx";
import CalendarioMes from "./calendario_mes.jsx";
import DiaDetalle from "./dia_detalle.jsx";
import MovimientoFormModal from "./movimiento_form_modal.jsx";
import TarjetasTotales from "./tarjetas_totales.jsx";

export default function CalendarioPage() {
  const hoy = hoyEn();
  const [params, setParams] = useSearchParams();
  const anio = Number(params.get("anio") ?? hoy.slice(0, 4));
  const mes = Number(params.get("mes") ?? hoy.slice(5, 7));
  const elegido = params.get("dia");
  const balance = useBalanceMes(anio, mes);
  const categorias = useCategoriasCaja();
  const crear = useCrearMovimiento();
  const editar = useEditarMovimiento();
  const anular = useAnularMovimiento();
  const toast = useToast();
  const [formulario, setFormulario] = useState(null); // { movimiento?, inicial? }
  const [anulando, setAnulando] = useState(null);

  const irA = (a, m) => setParams({ anio: String(a), mes: String(m) });
  const mesAnterior = () => (mes === 1 ? irA(anio - 1, 12) : irA(anio, mes - 1));
  const mesSiguiente = () => (mes === 12 ? irA(anio + 1, 1) : irA(anio, mes + 1));
  const esMesActual = `${anio}-${String(mes).padStart(2, "0")}` >= hoy.slice(0, 7);
  const elegir = (fecha) => setParams({ anio: String(anio), mes: String(mes), dia: fecha });

  async function guardar(datos) {
    await (datos.id ? editar : crear).mutateAsync(datos);
    toast.exito(datos.id ? "Movimiento actualizado" : "Movimiento registrado");
    setFormulario(null);
    // Queda elegido el día del movimiento, para verlo en el detalle.
    const [a, m] = datos.fecha.split("-").map(Number);
    setParams({ anio: String(a), mes: String(m), dia: datos.fecha });
  }

  async function confirmarAnulacion(datos) {
    await anular.mutateAsync(datos);
    toast.exito("Movimiento anulado");
    setAnulando(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Boton variante="secundario" tamano="icono" onClick={mesAnterior} aria-label="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </Boton>
          <h1 className="min-w-44 text-center font-titulos text-2xl font-bold">
            {MESES[mes - 1]} {anio}
          </h1>
          <Boton variante="secundario" tamano="icono" onClick={mesSiguiente} disabled={esMesActual} aria-label="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </Boton>
        </div>
        <Boton onClick={() => setFormulario({ inicial: { fecha: elegido && elegido <= hoy ? elegido : hoy } })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Registrar ingreso o egreso
        </Boton>
      </header>

      {balance.isPending ? (
        <Cargando texto="Cargando el mes..." />
      ) : balance.isError ? (
        <ErrorCarga error={balance.error} onReintentar={balance.refetch} />
      ) : (
        <>
          <TarjetasTotales totales={balance.data.totales} etiquetaSaldo="Saldo del mes" />
          <CalendarioMes anio={anio} mes={mes} dias={balance.data.dias} hoy={hoy} elegido={elegido} onElegir={elegir} />
        </>
      )}

      {elegido && (
        <DiaDetalle
          fecha={elegido}
          esFuturo={elegido > hoy}
          onRegistrar={(fecha) => setFormulario({ inicial: { fecha } })}
          onEditar={(movimiento) => setFormulario({ movimiento })}
          onAnular={setAnulando}
        />
      )}

      {formulario && (
        <MovimientoFormModal
          movimiento={formulario.movimiento}
          inicial={formulario.inicial}
          categorias={categorias.data ?? []}
          onGuardar={guardar}
          onCerrar={() => setFormulario(null)}
        />
      )}
      {anulando && <AnularModal movimiento={anulando} onAnular={confirmarAnulacion} onCerrar={() => setAnulando(null)} />}
    </div>
  );
}
