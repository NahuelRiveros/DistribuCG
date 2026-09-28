import Icono from "@/componentes/ui/icono.jsx";
import Enlace from "@/componentes/ui/enlace.jsx";
import EncabezadoSeccion from "./encabezado_seccion.jsx";

export default function SeccionContacto({ id, kicker, titulo, items = [] }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
      <EncabezadoSeccion kicker={kicker} titulo={titulo} />
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.etiqueta} className="flex items-start gap-4 rounded-2xl border border-borde bg-superficie p-6">
            <span className="rounded-xl bg-primario/10 p-3 text-primario">
              <Icono nombre={item.icono} />
            </span>
            <div>
              <p className="text-sm font-semibold text-texto-suave">{item.etiqueta}</p>
              {item.href ? (
                <Enlace a={item.href} className="font-medium text-primario hover:underline">
                  {item.valor}
                </Enlace>
              ) : (
                <p className="font-medium">{item.valor}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
