import { marca } from "./marca.js";

export const footer = {
  descripcion: marca.tagline,
  columnas: [
    {
      titulo: "Navegación",
      links: [
        { etiqueta: "Inicio", a: "/" },
        { etiqueta: "Cómo pedir", a: "/#como-pedir" },
        { etiqueta: "Contacto", a: "/#contacto" },
      ],
    },
    {
      titulo: "Contacto",
      links: [
        { etiqueta: "ventas@ejemplo.com", a: "mailto:ventas@ejemplo.com" },
        { etiqueta: "WhatsApp", a: "https://wa.me/5490000000000" },
      ],
    },
  ],
  legal: {
    titular: marca.razon_social || marca.nombre,
    desarrollado_por: "Riveros Edgardo Nahuel",
  },
};
