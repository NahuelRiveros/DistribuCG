import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import InputField from "./input_field.jsx";

// Traído de DistribuCG: espera a que el usuario deje de escribir antes de buscar.
export default function SearchField({ valor = "", onBuscar, etiqueta = "Buscar", placeholder = "Buscar…", demora = 350 }) {
  const [borrador, setBorrador] = useState({ origen: valor, texto: valor });
  if (borrador.origen !== valor) setBorrador({ origen: valor, texto: valor });

  useEffect(() => {
    if (borrador.texto.trim() === valor) return;
    const timer = setTimeout(() => onBuscar(borrador.texto.trim()), demora);
    return () => clearTimeout(timer);
  }, [borrador.texto, valor, onBuscar, demora]);

  return (
    <InputField
      name="buscar"
      type="search"
      aria-label={etiqueta}
      icon={Search}
      placeholder={placeholder}
      value={borrador.texto}
      onChange={(e) => setBorrador({ origen: valor, texto: e.target.value })}
    />
  );
}
