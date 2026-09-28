import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cliente } from "@/clientes/index.js";
import SeccionHero from "./secciones/seccion_hero.jsx";
import SeccionPilares from "./secciones/seccion_pilares.jsx";
import SeccionPasos from "./secciones/seccion_pasos.jsx";
import SeccionContacto from "./secciones/seccion_contacto.jsx";

// Tipo de sección (en clientes/<id>/home.js) → componente. Para un tipo nuevo:
// crear el componente en secciones/ y sumarlo acá.
const SECCIONES = {
  hero: SeccionHero,
  pilares: SeccionPilares,
  pasos: SeccionPasos,
  contacto: SeccionContacto,
};

export default function HomePage() {
  const { hash } = useLocation();

  // Links como "/#contacto" desde otra página: bajar hasta la sección al llegar.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return cliente.home.secciones.map((seccion, indice) => {
    const Seccion = SECCIONES[seccion.tipo];
    return Seccion ? <Seccion key={seccion.id ?? indice} {...seccion} /> : null;
  });
}
