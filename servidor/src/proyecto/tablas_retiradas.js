// Tablas de gimnasio, kinesiología, seguimiento de ejercicios, stock/kiosco e
// indumentaria: esos módulos se sacaron del proyecto (DistribuCG es solo distribuidora).
// Nombres fijos, solo en nuestro schema; IF EXISTS las hace idempotentes, así que corre
// en cada arranque sin costo. Primero las que dependen de otras.
export const TABLAS_RETIRADAS = [
  "recordatorio_kinesiologia", "sesion_kinesiologia", "ficha_kinesiologica",
  "paciente_patologia", "paciente_kinesiologia", "patologia",
  "sesion_kinesiologica_ejercicio", "sesion_kinesiologica", "rutina_ejercicio",
  "test_funcional", "test_fuerza", "registro_sesion_kinesiologia",
  "registro_ejercicio", "asignacion_profesional", "ejercicio", "grupo_muscular", "tipo_ejercicio",
  "ingreso", "alumno_estado_log", "membresia", "alumno", "plan_tipo", "alumno_estado",
  "movimiento_stock", "producto", "categoria_producto",
  "carrito_item", "carrito", "stock", "producto_tienda",
  "talle", "color", "marca", "categoria", "envio_opcion", "condicion_iva",
  // Core 2026-11: home editable (pasó a banners) y "Módulos habilitados" (los rubros los decide gate_config.js).
  // banner_anuncio no va acá: el arranque del rubro primero copia sus cintas a banner_promocion.
  "home_contenido", "home_area", "home_texto", "home_pilar", "home_contacto", "modulo_negocio",
];
