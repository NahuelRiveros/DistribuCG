/**
 * Identidad por cliente: textos, logo y fuentes.
 * La instalación activa se elige en client_config.js.
 * Paleta en theme_config.js; index.css conserva los tokens de base.
 */
import { clientConfig } from "../../../client_config.js";
export const clientes = {
  moovs: {
    nombre: "NOMBRE INC",
    rubro: "RUBRO FUTURO",
    tagline: "TAGLINE.",
    clienteActivo: true,

    logo: {
      tipo: "moovs-spine",
      texto: "MOOV",
      ariaLabel: "Moovs",
    },

    fuentes: {
      display: "'Bricolage Grotesque', sans-serif",
      body: "'Plus Jakarta Sans', sans-serif",
    },
  },

  gc: {
    nombre: "Norte Mayorista",
    // Forma corta de la marca — para textos grandes/destacados donde el
    // nombre completo no entra o sobra (ver footer_cta_titulo_resaltado en
    // home_config.js). Cambiar el nombre de la empresa es tan simple como
    // editar nombre/nombreCorto/tagline acá: todo lo demás (Home, Footer,
    // navbar) lee de este archivo, nunca un string suelto en otro lado.
    nombreCorto: "Norte",
    // Razón social — solo para el renglón de copyright del footer (ver
    // footer_config.js: legal.nombreDerechos). En todo el resto del sitio
    // se usa la marca comercial ("nombre"/"nombreCorto"), no esto.
    razonSocial: "Norte Mayorista S.R.L.",
    rubro: "Distribuidora mayorista y minorista" ,
    tagline: "Siempre para adelante.",

    // Isotipo: diseño provisto por el cliente (Canva), una "N" formada por
    // una caja de despacho en degradé ámbar + líneas de velocidad, en
    // navy/ámbar. Las imágenes en sí NO se cambian acá — el único lugar
    // para reemplazar el logo es src/config/logo_config.js (navbar/footer)
    // y public/logo-favicon.png (pestaña del navegador, ver index.html).
    // El nombre de tipo "gc-mark" quedó del cliente anterior — es un
    // identificador técnico interno que no se ve en ningún lado, no hace
    // falta renombrarlo.
    logo: {
      tipo: "gc-mark",
      texto: "Norte",
      ariaLabel: "Norte Mayorista",
    },

    fuentes: {
      display: "'Bricolage Grotesque', sans-serif",
      body: "'Plus Jakarta Sans', sans-serif",
    },
    // Paleta navy-teal + acento cálido: ver src/index.css (:root).
  },
};

export const clienteActivo = clientConfig.id;
export const brandConfig = clientes[clienteActivo];
