/**
 * Identidad visual de la instalacion (textos, logo, fuentes).
 *
 * Los COLORES no viven acá — están en src/index.css (:root), única fuente
 * de verdad del theme (así lo documenta ese mismo archivo). Antes se
 * duplicaban acá y un script (`apply_brand_theme.js`, ya sin lógica de
 * color) los volvía a aplicar en runtime, pisando lo que se editara en
 * index.css si alguien olvidaba sincronizar ambos lados.
 *
 * Para replicar el sistema en otro cliente, duplicar el objeto dentro de
 * `clientes`, cambiar textos/logo/fuentes acá y la paleta en index.css, y
 * setear `clienteActivo`.
 */
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
    nombre: "GC Distribuidora",
    rubro: "Distribuidora mayorista y minorista" ,
    tagline: "Tu pedido, directo al mostrador.",

    // Isotipo propio: hexágono con degradé de marca (--kt-teal-500 a
    // --kt-teal-900) + monograma "GC" en Bricolage Grotesque (la tipografía
    // real del sitio — antes el wordmark de texto plano usaba Raleway, sin
    // relación con el resto de la identidad). Archivo fuente en
    // src/assets/gc_mark.svg; el mismo diseño se usa como favicon
    // (public/gc-favicon.svg, ver index.html) para que la marca sea
    // consistente entre la pestaña del navegador y el navbar.
    logo: {
      tipo: "gc-mark",
      texto: "GC",
      ariaLabel: "GC Distribuidora",
    },

    fuentes: {
      display: "'Bricolage Grotesque', sans-serif",
      body: "'Plus Jakarta Sans', sans-serif",
    },
    // Paleta navy-teal + acento cálido: ver src/index.css (:root).
  },
};

export const clienteActivo = "gc";
export const brandConfig = clientes[clienteActivo];
