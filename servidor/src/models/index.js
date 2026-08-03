/**
 * models/index.js
 *
 * Registro central de modelos y asociaciones para el schema v3.
 * Importar SOLO desde aquí — nunca importar modelos individuales directamente.
 *
 * Uso en server.js:
 *   import "../models/index.js";  // efectos colaterales: registra asociaciones
 */

// ── persona/ — identidad base y sus catálogos ────────────────────────────────
import { Persona }         from "./persona/persona.js";
import { Sexo }            from "./persona/sexo.js";
import { TipoDocumento }   from "./persona/tipo_documento.js";
import { TipoPersona }     from "./persona/tipo_persona.js";

// ── usuarios/ — login y RBAC ──────────────────────────────────────────────────
import { Usuario }         from "./usuarios/usuario.js";
import { UsuarioRol }      from "./usuarios/usuario_rol.js";
import { Rol }             from "./usuarios/rol.js";
import { RolPermiso }      from "./usuarios/rol_permiso.js";
import { Permiso }         from "./usuarios/permiso.js";
import { Modulo }          from "./usuarios/modulo.js";

// ── alumnos/ — membresías de gimnasio ────────────────────────────────────────
import { Alumno }          from "./alumnos/alumno.js";
import { AlumnoEstado }    from "./alumnos/alumno_estado.js";
import { AlumnoEstadoLog } from "./alumnos/alumno_estado_log.js";
import { Membresia }       from "./alumnos/membresia.js";
import { Ingreso }         from "./alumnos/ingreso.js";
import { PlanTipo }        from "./alumnos/plan_tipo.js";

// ── kinesiologia/ — pacientes y patologías ───────────────────────────────────
import { PacienteKinesiologia } from "./kinesiologia/paciente_kinesiologia.js";
import { Patologia }        from "./kinesiologia/patologia.js";
import { PacientePatologia } from "./kinesiologia/paciente_patologia.js";
import { FichaKinesiologica } from "./kinesiologia/ficha_kinesiologica.js";
import { TestFuncional }     from "./kinesiologia/test_funcional.js";
import { TestFuerza }        from "./kinesiologia/test_fuerza.js";
import { RegistroSesionKinesiologia } from "./kinesiologia/registro_sesion_kinesiologia.js";

// ── seguimiento/ — asignación profesional y avances de ejercicio ────────────
import { AsignacionProfesional } from "./seguimiento/asignacion_profesional.js";
import { Ejercicio }        from "./seguimiento/ejercicio.js";
import { TipoEjercicio }    from "./seguimiento/tipo_ejercicio.js";
import { GrupoMuscular }    from "./seguimiento/grupo_muscular.js";
import { RegistroEjercicio } from "./seguimiento/registro_ejercicio.js";

// ── kiosco/ — productos y stock ───────────────────────────────────────────────
import { Producto }         from "./kiosco/producto.js";
import { CategoriaProducto } from "./kiosco/categoria_producto.js";
import { MovimientoStock }  from "./kiosco/movimiento_stock.js";

// ── home/ — contenido configurable del home (imágenes/videos en Cloudinary) ──
import { HomeArea }         from "./home/home_area.js";
import { HomeContenido }    from "./home/home_contenido.js";

// ─── Persona ↔ Catálogos ────────────────────────────────────────────────────
Persona.belongsTo(TipoDocumento, { foreignKey: "tipo_documento_id", as: "tipo_documento" });
Persona.belongsTo(Sexo,          { foreignKey: "sexo_id",           as: "sexo" });
Persona.belongsTo(TipoPersona,   { foreignKey: "tipo_persona_id",   as: "tipo_persona" });

// ─── Persona ↔ Alumno (1:1) ─────────────────────────────────────────────────
Persona.hasOne(Alumno, { foreignKey: "persona_id", as: "alumno" });
Alumno.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Alumno ↔ Estado ────────────────────────────────────────────────────────
Alumno.belongsTo(AlumnoEstado, { foreignKey: "estado_id", as: "estado" });
AlumnoEstado.hasMany(Alumno,   { foreignKey: "estado_id" });

// ─── Persona ↔ Usuario (1:1) ─────────────────────────────────────────────────
Persona.hasOne(Usuario, { foreignKey: "persona_id", as: "usuario" });
Usuario.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Usuario ↔ Rol (N:N) ─────────────────────────────────────────────────────
Usuario.belongsToMany(Rol, {
  through:     UsuarioRol,
  foreignKey:  "usuario_id",
  otherKey:    "rol_id",
  as:          "roles",
});
Rol.belongsToMany(Usuario, {
  through:     UsuarioRol,
  foreignKey:  "rol_id",
  otherKey:    "usuario_id",
  as:          "usuarios",
});

// ─── Módulo ↔ Permiso (1:N) ───────────────────────────────────────────────────
Modulo.hasMany(Permiso,    { foreignKey: "modulo_id", as: "permisos" });
Permiso.belongsTo(Modulo,  { foreignKey: "modulo_id", as: "modulo" });

// ─── Rol ↔ Permiso (N:N vía RolPermiso) ──────────────────────────────────────
Rol.belongsToMany(Permiso, {
  through:    RolPermiso,
  foreignKey: "rol_id",
  otherKey:   "permiso_id",
  as:         "permisos",
});
Permiso.belongsToMany(Rol, {
  through:    RolPermiso,
  foreignKey: "permiso_id",
  otherKey:   "rol_id",
  as:         "roles",
});

// ─── Alumno ↔ Membresia (1:N) ────────────────────────────────────────────────
Alumno.hasMany(Membresia,    { foreignKey: "alumno_id", as: "membresias" });
Membresia.belongsTo(Alumno,  { foreignKey: "alumno_id", as: "alumno" });

// ─── Membresia ↔ PlanTipo ────────────────────────────────────────────────────
Membresia.belongsTo(PlanTipo, { foreignKey: "plan_tipo_id", as: "plan_tipo" });
PlanTipo.hasMany(Membresia,   { foreignKey: "plan_tipo_id" });

// ─── Membresia ↔ Usuario (cobrado_por) ──────────────────────────────────────
Membresia.belongsTo(Usuario, { foreignKey: "cobrado_por_id", as: "cobrado_por" });

// ─── Membresia ↔ Ingreso (1:N) ───────────────────────────────────────────────
Membresia.hasMany(Ingreso,   { foreignKey: "membresia_id", as: "ingresos" });
Ingreso.belongsTo(Membresia, { foreignKey: "membresia_id", as: "membresia" });

// ─── AlumnoEstadoLog ─────────────────────────────────────────────────────────
AlumnoEstadoLog.belongsTo(Alumno,       { foreignKey: "alumno_id",          as: "alumno" });
AlumnoEstadoLog.belongsTo(AlumnoEstado, { foreignKey: "estado_anterior_id", as: "estado_anterior" });
AlumnoEstadoLog.belongsTo(AlumnoEstado, { foreignKey: "estado_nuevo_id",    as: "estado_nuevo" });
AlumnoEstadoLog.belongsTo(Usuario,      { foreignKey: "modificado_por",     as: "modificado_por_usuario" });
Alumno.hasMany(AlumnoEstadoLog,         { foreignKey: "alumno_id",          as: "estado_logs" });

// ─── Producto ↔ MovimientoStock (1:N) ────────────────────────────────────────
Producto.hasMany(MovimientoStock,      { foreignKey: "producto_id", as: "movimientos" });
MovimientoStock.belongsTo(Producto,    { foreignKey: "producto_id", as: "producto" });
MovimientoStock.belongsTo(Usuario,     { foreignKey: "registrado_por_id", as: "registrado_por" });

// ─── Producto ↔ CategoriaProducto (N:1) ──────────────────────────────────────
CategoriaProducto.hasMany(Producto,   { foreignKey: "categoria_id", as: "productos" });
Producto.belongsTo(CategoriaProducto, { foreignKey: "categoria_id", as: "categoria" });

// ─── Persona ↔ PacienteKinesiologia (1:1) ────────────────────────────────────
Persona.hasOne(PacienteKinesiologia,   { foreignKey: "persona_id", as: "paciente_kinesiologia" });
PacienteKinesiologia.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Persona ↔ AsignacionProfesional (1:N) ───────────────────────────────────
Persona.hasMany(AsignacionProfesional,    { foreignKey: "persona_id", as: "asignaciones_profesionales" });
AsignacionProfesional.belongsTo(Persona,  { foreignKey: "persona_id", as: "persona" });

// ─── Usuario (profesor) ↔ AsignacionProfesional (1:N) ────────────────────────
Usuario.hasMany(AsignacionProfesional,     { foreignKey: "profesor_id", as: "asignaciones_como_profesor" });
AsignacionProfesional.belongsTo(Usuario,   { foreignKey: "profesor_id", as: "profesor" });

// ─── Ejercicio ↔ Catálogos ────────────────────────────────────────────────────
TipoEjercicio.hasMany(Ejercicio,   { foreignKey: "tipo_ejercicio_id", as: "ejercicios" });
Ejercicio.belongsTo(TipoEjercicio, { foreignKey: "tipo_ejercicio_id", as: "tipo_ejercicio" });
GrupoMuscular.hasMany(Ejercicio,   { foreignKey: "grupo_muscular_id", as: "ejercicios" });
Ejercicio.belongsTo(GrupoMuscular, { foreignKey: "grupo_muscular_id", as: "grupo_muscular" });

// ─── Persona ↔ RegistroEjercicio (1:N) ───────────────────────────────────────
Persona.hasMany(RegistroEjercicio,   { foreignKey: "persona_id", as: "registros_ejercicio" });
RegistroEjercicio.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Ejercicio ↔ RegistroEjercicio (1:N) ─────────────────────────────────────
Ejercicio.hasMany(RegistroEjercicio,   { foreignKey: "ejercicio_id", as: "registros" });
RegistroEjercicio.belongsTo(Ejercicio, { foreignKey: "ejercicio_id", as: "ejercicio" });

// ─── Usuario ↔ RegistroEjercicio (quién lo cargó) ────────────────────────────
Usuario.hasMany(RegistroEjercicio,     { foreignKey: "registrado_por_id", as: "registros_ejercicio_cargados" });
RegistroEjercicio.belongsTo(Usuario,   { foreignKey: "registrado_por_id", as: "registrado_por" });

// ─── PacienteKinesiologia ↔ Patologia (N:N vía PacientePatologia) ────────────
PacienteKinesiologia.belongsToMany(Patologia, {
  through:    PacientePatologia,
  foreignKey: "paciente_kinesiologia_id",
  otherKey:   "patologia_id",
  as:         "patologias",
});
Patologia.belongsToMany(PacienteKinesiologia, {
  through:    PacientePatologia,
  foreignKey: "patologia_id",
  otherKey:   "paciente_kinesiologia_id",
  as:         "pacientes",
});

// ─── HomeArea ↔ HomeContenido (1:N) ───────────────────────────────────────────
HomeArea.hasMany(HomeContenido,   { foreignKey: "area_id", as: "contenidos" });
HomeContenido.belongsTo(HomeArea, { foreignKey: "area_id", as: "area" });

// ─── PacientePatologia ↔ FichaKinesiologica (1:1) ────────────────────────────
PacientePatologia.hasOne(FichaKinesiologica,   { foreignKey: "paciente_patologia_id", as: "ficha" });
FichaKinesiologica.belongsTo(PacientePatologia, { foreignKey: "paciente_patologia_id", as: "paciente_patologia" });
FichaKinesiologica.belongsTo(Usuario,           { foreignKey: "creado_por_id", as: "creado_por" });

// ─── FichaKinesiologica ↔ TestFuncional / TestFuerza / RegistroSesionKinesiologia (1:N) ──
FichaKinesiologica.hasMany(TestFuncional,   { foreignKey: "ficha_id", as: "tests_funcionales" });
TestFuncional.belongsTo(FichaKinesiologica, { foreignKey: "ficha_id", as: "ficha" });
TestFuncional.belongsTo(Ejercicio,          { foreignKey: "ejercicio_id", as: "ejercicio" });
TestFuncional.belongsTo(Usuario,            { foreignKey: "registrado_por_id", as: "registrado_por" });

FichaKinesiologica.hasMany(TestFuerza,   { foreignKey: "ficha_id", as: "tests_fuerza" });
TestFuerza.belongsTo(FichaKinesiologica, { foreignKey: "ficha_id", as: "ficha" });
TestFuerza.belongsTo(Ejercicio,          { foreignKey: "ejercicio_id", as: "ejercicio" });
TestFuerza.belongsTo(Usuario,            { foreignKey: "registrado_por_id", as: "registrado_por" });

FichaKinesiologica.hasMany(RegistroSesionKinesiologia,   { foreignKey: "ficha_id", as: "sesiones" });
RegistroSesionKinesiologia.belongsTo(FichaKinesiologica, { foreignKey: "ficha_id", as: "ficha" });
RegistroSesionKinesiologia.belongsTo(Ejercicio,          { foreignKey: "ejercicio_id", as: "ejercicio" });
RegistroSesionKinesiologia.belongsTo(Usuario,            { foreignKey: "registrado_por_id", as: "registrado_por" });

export {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado,
  Rol, Modulo, Permiso, RolPermiso,
  Persona, Usuario, UsuarioRol,
  PlanTipo, Alumno, Membresia, Ingreso, AlumnoEstadoLog,
  Producto, MovimientoStock, CategoriaProducto,
  PacienteKinesiologia, AsignacionProfesional,
  TipoEjercicio, GrupoMuscular, Ejercicio, RegistroEjercicio,
  Patologia, PacientePatologia,
  FichaKinesiologica, TestFuncional, TestFuerza, RegistroSesionKinesiologia,
  HomeArea, HomeContenido,
};
