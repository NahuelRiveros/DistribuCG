import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { getBannerPublico } from "../../api/banner_anuncio_api.js";

const ROTAR_MS = 5000;

/**
 * Cinta de anuncios del sitio (ej. "Envío gratis desde $50.000") — hasta 4,
 * editables desde Sistema > Anuncios sin tocar código. Va arriba de todo,
 * antes del navbar, en toda la app (no es específico de ningún módulo).
 * staleTime largo porque cambia rarísima vez y se pide en cada carga.
 */
export default function AnunciosBanner() {
  const { data } = useQuery({ queryKey: ["banner-anuncios"], queryFn: getBannerPublico, staleTime: 5 * 60 * 1000 });
  const anuncios = data ?? [];
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (anuncios.length < 2) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % anuncios.length), ROTAR_MS);
    return () => clearInterval(id);
  }, [anuncios.length]);

  if (!anuncios.length) return null;
  const actual = anuncios[indice % anuncios.length];

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-(--kt-night) px-3 py-2 text-center text-xs font-semibold text-white sm:text-sm">
      <Megaphone size={14} className="shrink-0 text-(--kt-turquoise)" />
      <span key={actual.id} className="kt-item-in truncate">{actual.texto}</span>
    </div>
  );
}
