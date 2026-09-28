import { Suspense } from "react";
import { ROLES_PANEL, tieneRol } from "compartido/reglas/roles.js";
import { modulosActivos } from "@/modulos/registro.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { Cargando } from "@/componentes/ui/estado_carga.jsx";

export default function PanelInicioPage() {
  const { usuario } = useAuth();
  const secciones = modulosActivos.filter((m) => m.resumenAdmin && tieneRol(usuario, m.menuAdmin?.roles ?? ROLES_PANEL));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-titulos text-2xl font-bold">Hola, {usuario?.nombre}</h1>
      <p className="text-sm text-texto-suave">Resumen de tu negocio. Elegí una sección en el menú para empezar.</p>

      <div className="mt-8 space-y-8">
        {secciones.map(({ codigo, menuAdmin, resumenAdmin: Resumen }) => (
          <section key={codigo} aria-labelledby={`resumen-${codigo}`}>
            <h2 id={`resumen-${codigo}`} className="mb-3 text-lg font-bold">
              {menuAdmin?.titulo ?? codigo}
            </h2>
            <Suspense fallback={<Cargando />}>
              <Resumen />
            </Suspense>
          </section>
        ))}
      </div>
    </div>
  );
}
