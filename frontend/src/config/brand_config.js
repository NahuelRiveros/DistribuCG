/**
 * Identidad visual de la instalacion.
 *
 * Para replicar el sistema en otro cliente, duplicar el objeto dentro de
 * `clientes`, cambiar colores/textos y setear `clienteActivo`.
 */
export const clientes = {
  moovs: {
    nombre: "Moovs",
    rubro: "Gimnasio & Kinesiología",
    tagline: "Move mejor. Vivi mejor.",
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

    colores: {
      accent: "#87C7E8",
      accentSoft: "#EAF6FC",
      accentBorder: "#C7E6F4",
      primary: "#47556A",
      primaryDark: "#243447",
      primarySoft: "#909BAA",
      night: "#17283A",
      bg: "#FFFFFF",
      bgSoft: "#F3F5F7",
      ink: "#243447",
      inkSoft: "#647184",
      border: "#DDE4EA",
      inkMute: "#909BAA",
      success: "#047857",
      successBg: "#ECFDF5",
      warning: "#B45309",
      warningBg: "#FFFBEB",
      danger: "#B91C1C",
      dangerBg: "#FEF2F2",
    },
  },
};

export const clienteActivo = "moovs";
export const brandConfig = clientes[clienteActivo];
