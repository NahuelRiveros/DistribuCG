import { NavLink, useLocation } from "react-router-dom";
import { esExternoSeguro, esInterno } from "@/utils/enlaces.js";

/**
 * Link que funciona igual para rutas internas y externas definidas en la config del cliente.
 * `claseActiva` se suma cuando la ruta interna es la página actual ("/" solo si es exacta).
 */
export default function Enlace({ a, children, className = "", claseActiva = "", onClick }) {
  const { search, hash } = useLocation();
  if (esInterno(a)) {
    // "/catalogo?oferta=1" está activo solo con esa búsqueda, y "/#contacto" solo en esa sección
    // (si no, todos los links del inicio se marcaban a la vez).
    const busqueda = a.includes("?") ? a.slice(a.indexOf("?")).split("#")[0] : "";
    const ancla = a.includes("#") ? a.slice(a.indexOf("#")) : "";
    const coincide = (!busqueda || busqueda === search) && (ancla ? ancla === hash : !hash || a !== "/");
    return (
      <NavLink
        to={a}
        end={a === "/"}
        className={({ isActive }) => (isActive && claseActiva && coincide ? `${className} ${claseActiva}` : className)}
        onClick={onClick}
      >
        {children}
      </NavLink>
    );
  }
  if (esExternoSeguro(a)) {
    const nuevaPestana = a.startsWith("http");
    return (
      <a
        href={a}
        className={className}
        onClick={onClick}
        {...(nuevaPestana ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return <span className={className}>{children}</span>;
}
