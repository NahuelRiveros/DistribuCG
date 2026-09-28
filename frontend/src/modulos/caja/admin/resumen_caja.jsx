import { Link } from "react-router-dom";
import { hoyEn, MESES } from "compartido/reglas/fechas.js";
import { useBalanceMes } from "../hooks/use_caja.js";
import TarjetasTotales from "./tarjetas_totales.jsx";

/** Caja del mes en curso, para el inicio del panel (solo lo ven los admin). */
export default function ResumenCaja() {
  const hoy = hoyEn();
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  const { data } = useBalanceMes(anio, mes);

  return (
    <div className="space-y-2">
      <TarjetasTotales totales={data?.totales ?? { ingresos: 0, egresos: 0, saldo: 0 }} etiquetaSaldo={`Saldo de ${MESES[mes - 1].toLowerCase()}`} />
      <Link to="/admin/caja/calendario" className="inline-block text-sm font-medium text-primario hover:underline">
        Ver el calendario de la caja →
      </Link>
    </div>
  );
}
