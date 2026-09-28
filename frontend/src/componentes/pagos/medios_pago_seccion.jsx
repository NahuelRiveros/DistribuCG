import { hoyEn } from "compartido/reglas/fechas.js";
import { conDescuento, cuotasDe, financiacionActiva, mediosTienda, promocionesVigentes } from "compartido/reglas/pagos.js";
import Insignia from "@/componentes/ui/insignia.jsx";
import { formatearDinero } from "@/utils/formatear_dinero.js";
import DatosTransferencia from "./datos_transferencia.jsx";
import LogosMedios from "./logos_medios.jsx";

function Apartado({ numero, titulo, children }) {
  return (
    <section aria-labelledby={`pago-${numero}`} className="border-t border-borde pt-4 first:border-t-0 first:pt-0">
      <h3 id={`pago-${numero}`} className="font-semibold">
        {titulo}
      </h3>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}

const fechaCorta = (texto) => texto.split("-").reverse().join("/");

/**
 * Todo lo de pago en la ficha: medios habituales (con el CBU), financiación y promociones
 * bancarias vigentes. La cinta destacada va junto al precio (ResumenPago / CintaPago).
 * Los importes se calculan sobre `precio`.
 */
export default function MediosPagoSeccion({ precio, pagos }) {
  const medios = mediosTienda(pagos);
  const financiacion = financiacionActiva(pagos);
  const promociones = promocionesVigentes(hoyEn(), pagos);
  if (medios.length === 0 && financiacion.length === 0) return null;

  return (
    <section aria-labelledby="medios-pago" className="mt-8 rounded-2xl border border-borde bg-superficie p-5">
      <h2 id="medios-pago" className="font-titulos text-xl font-bold">
        Medios de pago y financiación
      </h2>
      <div className="mt-4 space-y-4">
        <Apartado numero={1} titulo="Métodos de pago">
          <ul className="space-y-3">
            {medios.map((m) => (
              <li key={m.valor}>
                <p className="flex flex-wrap items-center gap-2">
                  <strong>{m.etiqueta}</strong>
                  {m.descuento > 0 && (
                    <Insignia tono="exito">
                      {m.descuento}% OFF · {formatearDinero(conDescuento(precio, m.descuento).total)}
                    </Insignia>
                  )}
                </p>
                {m.detalle && <p className="text-texto-suave">{m.detalle}</p>}
                <LogosMedios logos={m.logos} className="mt-1.5" />
                {m.valor === "transferencia" && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-semibold text-primario">Ver CBU y alias</summary>
                    <DatosTransferencia datos={pagos.datos_transferencia} className="mt-2" />
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Apartado>

        <Apartado numero={2} titulo="Financiación y cuotas">
          {financiacion.length === 0 ? (
            <p className="text-texto-suave">Por el momento no ofrecemos pago en cuotas.</p>
          ) : (
            <ul className="space-y-3">
              {financiacion.map((f) => (
                <li key={f.nombre}>
                  <p className="flex flex-wrap items-center gap-2">
                    <strong>{f.nombre}</strong>
                    <LogosMedios logos={f.logos} />
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {f.planes.map((plan) => {
                      const c = cuotasDe(precio, plan);
                      return (
                        <li key={plan.cuotas}>
                          <strong>{c.cuotas} cuotas</strong> de <span className="tabular-nums">{formatearDinero(c.valor_cuota)}</span>{" "}
                          {c.sin_interes ? (
                            <strong className="text-emerald-700">sin interés</strong>
                          ) : (
                            <span className="text-texto-suave">
                              con interés · total {formatearDinero(c.total)}
                              {plan.cft ? ` · ${plan.cft}` : ""}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Apartado>

        <Apartado numero={3} titulo="Promociones bancarias">
          {promociones.length === 0 ? (
            <p className="text-texto-suave">Sin promociones bancarias especiales vigentes en este momento.</p>
          ) : (
            <ul className="space-y-2">
              {promociones.map((p) => (
                <li key={`${p.banco}-${p.detalle}`}>
                  <p className="flex flex-wrap items-center gap-2">
                    <strong>{p.banco}:</strong> {p.detalle}
                    {p.dias.length > 0 && <span className="text-texto-suave">los {p.dias.join(" y ")}</span>}
                    {p.hoy && p.dias.length > 0 && <Insignia tono="exito">¡Hoy!</Insignia>}
                  </p>
                  <p className="text-xs text-texto-suave">{[p.tope, p.hasta && `Vigente hasta el ${fechaCorta(p.hasta)}`].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Apartado>
      </div>
    </section>
  );
}
