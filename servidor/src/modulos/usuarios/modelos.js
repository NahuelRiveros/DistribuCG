// Importar los modelos del módulo desde acá: garantiza que las relaciones estén aplicadas.
import { aplicarRelaciones } from "../../nucleo/db/relaciones.js";
import { Usuario, ATRIBUTOS_PUBLICOS } from "./usuario_modelo.js";
import { Rol, ROLES } from "./rol_modelo.js";
import { UsuarioRol } from "./usuario_rol_modelo.js";

aplicarRelaciones([
  { tipo: "belongsToMany", from: Usuario, to: Rol, through: UsuarioRol, foreignKey: "usuario_id", otherKey: "rol_id", as: "roles" },
  { tipo: "belongsToMany", from: Rol, to: Usuario, through: UsuarioRol, foreignKey: "rol_id", otherKey: "usuario_id", as: "usuarios" },
]);

export { Usuario, ATRIBUTOS_PUBLICOS, Rol, ROLES, UsuarioRol };
