import { cliente } from "@/clientes/index.js";
import Enlace from "@/componentes/ui/enlace.jsx";

export default function Footer() {
  const { marca, footer } = cliente;
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-primario text-primario-texto">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <img src={marca.logo} alt="" className="h-10 w-10 rounded-lg bg-white p-1" />
            <span className="font-titulos text-xl font-bold">{marca.nombre}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm opacity-80">{footer.descripcion}</p>
        </div>

        {footer.columnas.map((columna) => (
          <div key={columna.titulo}>
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">{columna.titulo}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {columna.links.map((link) => (
                <li key={link.a}>
                  <Enlace a={link.a} className="opacity-90 hover:underline hover:opacity-100">
                    {link.etiqueta}
                  </Enlace>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs opacity-70 sm:flex-row sm:justify-between">
          <span>© {anio} {footer.legal.titular}. Todos los derechos reservados.</span>
          {footer.legal.desarrollado_por && <span>Desarrollado por {footer.legal.desarrollado_por}</span>}
        </div>
      </div>
    </footer>
  );
}
