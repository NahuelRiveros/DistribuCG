import {
  Dumbbell, HeartPulse, Target, UserCheck, LineChart, Activity, Trophy,
  MapPin, Instagram, Phone, Mail, MessageCircle, Clock, Users, ShieldCheck, Star,
  Package, Truck,
} from "lucide-react";

// Mapa fijo de íconos permitidos para HomePilar/HomeContacto — el admin elige
// de una lista visual, nunca escribe el nombre a mano, así que esto es
// también la única fuente de verdad para pintarlos en el home público.
export const ICONOS_HOME = {
  Dumbbell, HeartPulse, Target, UserCheck, LineChart, Activity, Trophy,
  MapPin, Instagram, Phone, Mail, MessageCircle, Clock, Users, ShieldCheck, Star,
  Package, Truck,
};

export const ICONOS_HOME_NOMBRES = Object.keys(ICONOS_HOME);

/** Componente de ícono para un nombre guardado en la base — Star si no se reconoce. */
export function iconoHome(nombre) {
  return ICONOS_HOME[nombre] ?? Star;
}
