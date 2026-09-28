import {
  Clock,
  CreditCard,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
} from "lucide-react";

// Iconos que se pueden usar por nombre desde la config de un cliente (home.js).
// Para sumar uno: importarlo de lucide-react y agregarlo acá.
const ICONOS = { Clock, CreditCard, Headphones, Mail, MapPin, MessageCircle, Package, Phone, ShieldCheck, ShoppingBag, Store, Tag, Truck };

export default function Icono({ nombre, className = "h-5 w-5" }) {
  const Componente = ICONOS[nombre] ?? Package;
  return <Componente className={className} aria-hidden="true" />;
}
