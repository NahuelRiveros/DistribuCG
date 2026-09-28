import { marca } from "./marca.js";

// El Home se arma con secciones reutilizables, en el orden de esta lista.
// Tipos disponibles: hero, pilares, pasos, contacto (ver src/modulos/home/secciones/).
// Iconos disponibles: ver src/componentes/ui/icono.jsx.
export const home = {
  secciones: [
    {
      tipo: "hero",
      kicker: marca.rubro,
      titulo: `Somos ${marca.nombre}`,
      subtitulo: "Miles de productos, precios al día y entrega coordinada. Armá tu pedido online y nosotros nos encargamos del resto.",
      cta_primario: { texto: "Ver productos", a: "/catalogo" },
      cta_secundario: { texto: "Cómo pedir", a: "/#como-pedir" },
    },
    {
      tipo: "pilares",
      id: "por-que",
      kicker: "Por qué elegirnos",
      titulo: "Comprar mayorista, sin vueltas",
      items: [
        { icono: "Package", titulo: "Todos los productos", texto: "Productos organizados por categoría, con precio y disponibilidad al día." },
        { icono: "Truck", titulo: "Entrega puntual", texto: "Coordinamos el despacho de cada pedido y te avisamos su estado." },
        { icono: "ShieldCheck", titulo: "Pagos flexibles", texto: "Efectivo o transferencia. Coordinamos el pago al confirmar el pedido." },
      ],
    },
    {
      tipo: "pasos",
      id: "como-pedir",
      kicker: "Así de simple",
      titulo: "Cómo hacer tu pedido",
      items: [
        { titulo: "Elegís tus productos", texto: "Buscá por nombre o categoría." },
        { titulo: "Armás tu pedido", texto: "Podés dejarlo a medias y volver después." },
        { titulo: "Coordinamos la entrega", texto: "Confirmamos disponibilidad y te avisamos cuándo llega." },
      ],
    },
    {
      tipo: "contacto",
      id: "contacto",
      kicker: "Hablemos",
      titulo: "Contactanos",
      items: [
        { icono: "MapPin", etiqueta: "Dirección", valor: "[Completar dirección]" },
        { icono: "MessageCircle", etiqueta: "WhatsApp", valor: "[Completar número]", href: "https://wa.me/5490000000000" },
        { icono: "Mail", etiqueta: "Email", valor: "ventas@ejemplo.com", href: "mailto:ventas@ejemplo.com" },
      ],
    },
  ],
};
