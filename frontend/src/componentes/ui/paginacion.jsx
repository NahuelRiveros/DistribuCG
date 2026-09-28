import Boton from "./boton.jsx";

// Traído de DistribuCG (controls/ui/pagination.jsx). Recibe la `paginacion` que devuelve el API.
export default function Paginacion({ paginacion, onCambiar, deshabilitado = false }) {
  if (!paginacion?.total) return null;
  const { pagina, total_paginas, total } = paginacion;
  return (
    <nav aria-label="Páginas de resultados" className="flex flex-wrap items-center justify-center gap-3 py-5">
      <Boton variante="secundario" tamano="chico" disabled={deshabilitado || pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        Anterior
      </Boton>
      <span aria-live="polite" className="text-sm text-texto-suave">
        Página {pagina} de {Math.max(1, total_paginas)} · {total} resultado{total === 1 ? "" : "s"}
      </span>
      <Boton variante="secundario" tamano="chico" disabled={deshabilitado || pagina >= total_paginas} onClick={() => onCambiar(pagina + 1)}>
        Siguiente
      </Boton>
    </nav>
  );
}
