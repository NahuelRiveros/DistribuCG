import { Navigate, useLocation } from "react-router-dom";
import { tieneRol } from "compartido/reglas/roles.js";
import { useAuth } from "@/modulos/usuarios/auth_context.jsx";
import { linkConRetorno } from "./volver_a.js";

/**
 * <RutaProtegida>                         → requiere sesión
 * <RutaProtegida roles={["admin","staff"]}> → requiere alguno de esos roles
 * Es comodidad visual: la seguridad real la valida el servidor en cada endpoint.
 */
export default function RutaProtegida({ children, roles = [] }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-texto-suave" role="status">
        Verificando sesión...
      </div>
    );
  }
  if (!usuario) {
    return <Navigate to={linkConRetorno("/login", location.pathname + location.search)} replace />;
  }
  if (roles.length > 0 && !tieneRol(usuario, roles)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
