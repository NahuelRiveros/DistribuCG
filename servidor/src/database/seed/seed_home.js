import { HomeTexto, HomePilar, HomeContacto } from "../../models/index.js";

// Copia exacta de lo que hoy está hardcodeado en home_page.jsx — así el sitio
// se ve igual apenas se despliega esto, hasta que alguien lo edite desde
// /admin/home-config. findOrCreate: no pisa ediciones ya hechas por el cliente.
export async function seed_home() {
  const textos = [
    { clave: "hero_kicker",              etiqueta: "Texto de la pastilla superior",     seccion: "hero",       valor: "Centro de Distribución" },
    { clave: "hero_subtitulo",           etiqueta: "Subtítulo del hero",                seccion: "hero",       valor: "Entrenamiento 100 % personalizado con seguimiento real de cada ejercicio, y kinesiología para acompañar tu recuperación." },
    { clave: "hero_cta_primario",        etiqueta: "Texto del botón principal",         seccion: "hero",       valor: "Conocenos" },
    { clave: "hero_cta_secundario",      etiqueta: "Texto del botón secundario",        seccion: "hero",       valor: "Contacto" },
    { clave: "pilares_kicker",           etiqueta: "Texto pequeño de la sección",       seccion: "pilares",    valor: "Nuestro fuerte" },
    { clave: "pilares_titulo",           etiqueta: "Título (primera línea)",            seccion: "pilares",    valor: "Entrenamiento y kinesiología," },
    { clave: "pilares_titulo_resaltado", etiqueta: "Título (línea resaltada)",          seccion: "pilares",    valor: "en un solo lugar" },
    { clave: "galeria_kicker",           etiqueta: "Texto pequeño de la sección",       seccion: "galeria",    valor: "Lo que hacemos" },
    { clave: "galeria_titulo",           etiqueta: "Título de la sección",              seccion: "galeria",    valor: "Conocé el espacio" },
    { clave: "contacto_kicker",          etiqueta: "Texto pequeño de la sección",       seccion: "contacto",   valor: "Hablemos" },
    { clave: "contacto_titulo",          etiqueta: "Título de la sección",              seccion: "contacto",   valor: "Empezá hoy" },
    { clave: "footer_cta_titulo",        etiqueta: "Título (primera línea)",            seccion: "footer_cta", valor: "Movete con" },
    { clave: "footer_cta_titulo_resaltado", etiqueta: "Título (segunda línea)",         seccion: "footer_cta", valor: "un plan" },
    { clave: "footer_cta_texto",         etiqueta: "Texto debajo del título",           seccion: "footer_cta", valor: "Entrenamiento personalizado y kinesiología, pensados para vos." },
  ];
  for (const t of textos) {
    await HomeTexto.findOrCreate({ where: { clave: t.clave }, defaults: t });
  }

  const pilares = [
    { icono: "Dumbbell",   titulo: "Entrenamiento personalizado", texto: "Cada plan se arma a tu medida — objetivos, nivel y disponibilidad. Nada de rutinas genéricas.", orden: 1 },
    { icono: "HeartPulse", titulo: "Kinesiología",                texto: "Evaluación, recuperación y rehabilitación guiada por profesionales, integrada a tu entrenamiento.", orden: 2 },
  ];
  for (const p of pilares) {
    await HomePilar.findOrCreate({ where: { titulo: p.titulo }, defaults: p });
  }

  const contactos = [
    { icono: "MapPin",     label: "Ubicación",  valor: "[Tu dirección acá]", href: "#", orden: 1 },
    { icono: "Instagram",  label: "Instagram",  valor: "@kinetica",          href: "#", orden: 2 },
  ];
  for (const c of contactos) {
    await HomeContacto.findOrCreate({ where: { label: c.label }, defaults: c });
  }
}
