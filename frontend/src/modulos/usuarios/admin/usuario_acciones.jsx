import { KeyRound, Lock, Pencil, UserCheck, UserX } from "lucide-react";
import Boton from "@/componentes/ui/boton.jsx";

/**
 * Botones de cada usuario del listado. Si el actor no puede modificarlo (él mismo,
 * el super admin u otro admin), muestra el motivo en vez de botones que después fallarían.
 */
export default function UsuarioAcciones({ usuario, onEditar, onContrasena, onEstado, conTexto = false }) {
  const nombre = usuario.nombre;

  if (!usuario.gestionable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-texto-suave" title={usuario.motivo_no_gestionable}>
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className={conTexto ? "" : "sr-only"}>{usuario.motivo_no_gestionable}</span>
      </span>
    );
  }

  const tamano = conTexto ? "chico" : "icono";
  const texto = (t) => (conTexto ? t : null);
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Boton variante={conTexto ? "secundario" : "fantasma"} tamano={tamano} onClick={() => onEditar(usuario)} aria-label={`Editar a ${nombre}`} title="Editar">
        <Pencil className="h-4 w-4" aria-hidden="true" /> {texto("Editar")}
      </Boton>
      <Boton variante={conTexto ? "secundario" : "fantasma"} tamano={tamano} onClick={() => onContrasena(usuario)} aria-label={`Cambiar la contraseña de ${nombre}`} title="Cambiar contraseña">
        <KeyRound className="h-4 w-4" aria-hidden="true" /> {texto("Contraseña")}
      </Boton>
      {usuario.activo ? (
        <Boton variante={conTexto ? "secundario" : "fantasma"} tamano={tamano} onClick={() => onEstado(usuario)} aria-label={`Desactivar a ${nombre}`} title="Desactivar" className="text-peligro">
          <UserX className="h-4 w-4" aria-hidden="true" /> {texto("Desactivar")}
        </Boton>
      ) : (
        <Boton variante={conTexto ? "secundario" : "fantasma"} tamano={tamano} onClick={() => onEstado(usuario)} aria-label={`Reactivar a ${nombre}`} title="Reactivar">
          <UserCheck className="h-4 w-4" aria-hidden="true" /> {texto("Reactivar")}
        </Boton>
      )}
    </div>
  );
}
