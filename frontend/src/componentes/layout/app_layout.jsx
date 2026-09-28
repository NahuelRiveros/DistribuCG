import { Outlet } from "react-router-dom";
import Navbar from "./navbar.jsx";
import Footer from "./footer.jsx";
import { modulosActivos } from "@/modulos/registro.js";

const GLOBALES = modulosActivos.flatMap((m) => m.globales ?? []);

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-superficie focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {GLOBALES.map((Componente, i) => (
        <Componente key={i} />
      ))}
    </div>
  );
}
