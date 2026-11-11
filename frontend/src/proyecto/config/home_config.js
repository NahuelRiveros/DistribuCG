/**
 * Contenido fijo del inicio de la tienda, un objeto por cliente (mismo switch que brand_config.js).
 * Las promociones (carrusel y cinta) no van acá: se cargan desde el panel, en "Banners y
 * promociones", con fecha de inicio y fin. El nombre de la empresa sale siempre de brand_config.js.
 * Para un cliente nuevo: sumar una entrada con la misma forma, nunca pisar la de "gc".
 */

import { Package, Truck, Clock, ShieldCheck } from "lucide-react";
import { clienteActivo } from "./brand_config.js";

const clientes = {
  gc: {
    // Portada que arma el rubro (home_tienda.jsx).
    portada: {
      heroTitulo: "Todo para abastecer",
      heroTituloResaltado: "tu negocio.",
      heroSubtitulo: "Explorá nuestros productos, encontrá ofertas y armá tu pedido mayorista o minorista en un solo lugar.",
      heroCta: "Ver catálogo",
    },
    // Chips debajo de la portada.
    valor: [
      { icon: Package, label: "Catálogo completo" },
      { icon: Truck, label: "Entrega puntual" },
      { icon: Clock, label: "Stock al día" },
      { icon: ShieldCheck, label: "Pedidos sin sorpresas" },
    ],
    // Pie de página { id, icono, label, valor, href }. Los que están entre corchetes no se muestran.
    contactos: [
      { id: "ubicacion", icono: "MapPin", label: "Ubicación", valor: "[Tu dirección acá]", href: "#" },
      { id: "whatsapp", icono: "MessageCircle", label: "WhatsApp", valor: "[Tu número acá]", href: "#" },
      { id: "catalogo", icono: "Package", label: "Catálogo online", valor: "Mirá los productos y armá tu pedido", href: "/distribuidora/catalogo" },
    ],
  },

  // Cliente a definir (ver brand_config.js): completar antes de activarlo.
  moovs: {
    portada: {
      heroTitulo: "[COMPLETAR título]",
      heroTituloResaltado: "",
      heroSubtitulo: "[COMPLETAR qué ofrece el negocio]",
      heroCta: "Ver catálogo",
    },
    valor: [],
    contactos: [],
  },
};

const contenido = clientes[clienteActivo] ?? clientes.gc;

export const HOME_VALOR = contenido.valor;
export const HOME_CONTACTOS = contenido.contactos;

export const HOME_TIENDA = {
  ...contenido.portada,
  buscarPlaceholder: "Producto, marca o código",
  promoEtiqueta: "Ofertas destacadas",
  promoTitulo: "Oportunidades para tu próximo pedido.",
  promoTexto: "Descubrí los productos con precio especial y sumalos a tu compra.",
  promoCta: "Explorar ofertas",
  catalogoEtiqueta: "Nuestro catálogo",
  catalogoTitulo: "Todo en un solo pedido.",
  catalogoTexto: "Descubrí nuestros productos y encontrá lo que necesitás para tu negocio o tu casa.",
  catalogoCta: "Explorar productos",
  familiasEtiqueta: "Encontrá lo que necesitás",
  familiasTitulo: "Comprá por categoría",
  productosEtiqueta: "Seguí explorando",
  productosTitulo: "Productos para tu pedido",
};
