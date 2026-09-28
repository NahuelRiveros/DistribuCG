import cabal from "@/assets/medios_pago/cabal.png";
import goCuotas from "@/assets/medios_pago/go_cuotas.png";
import mastercard from "@/assets/medios_pago/mastercard.png";
import mercadoPago from "@/assets/medios_pago/mercado_pago.png";
import naranjaX from "@/assets/medios_pago/naranja_x.png";
import visa from "@/assets/medios_pago/visa.svg";

// Imagen y nombre de cada logo. Las claves son las de compartido/reglas/pagos.js (LOGOS_MEDIOS).
export const LOGOS = {
  visa: { src: visa, nombre: "Visa" },
  mastercard: { src: mastercard, nombre: "Mastercard" },
  cabal: { src: cabal, nombre: "Cabal" },
  naranja_x: { src: naranjaX, nombre: "Naranja X" },
  mercado_pago: { src: mercadoPago, nombre: "Mercado Pago" },
  go_cuotas: { src: goCuotas, nombre: "GoCuotas" },
};
