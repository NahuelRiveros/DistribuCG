import { Outlet, ScrollRestoration } from "react-router-dom";
import AvisoServidor from "@/componentes/sistema/aviso_servidor.jsx";

// Raíz común de la tienda y del panel: al navegar, vuelve arriba (o a donde estaba al ir "atrás"),
// y avisa si la API tarda en despertar o no responde.
export default function Raiz() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
      <AvisoServidor />
    </>
  );
}
