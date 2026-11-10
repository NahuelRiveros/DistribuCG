// GATE MAESTRO — qué tipo de proyecto es este cliente.
//
// Vive en la raíz del repo (no dentro de frontend/ ni de servidor/) porque
// los dos lados lo leen: el frontend lo usa para armar navbar/rutas
// (frontend/src/config/gate_config.js re-exporta este archivo) y el
// backend lo usa para decidir qué tablas sincronizar al bootstrapear la
// base (servidor/src/configuracion_servidor/gate_config.js también
// re-exporta este archivo, ver database/bootstrap.js). Un solo objeto,
// se edita acá y ya — ningún otro archivo debería declarar sus propios
// valores de projectModules.
//
// Tocar estos valores alcanza para prender/apagar un módulo entero
// (rutas, navbar, tablas de base de datos). DistribuCG es solo distribuidora:
// gimnasio y kinesiología se sacaron del proyecto (código y tablas).
//
// Ver también: scripts/analizar_modulos.mjs (reporta qué carpetas le
// corresponden a cada módulo) y servidor/src/database/bootstrap.js (usa
// estos flags para no crear tablas de módulos apagados en el deploy).
export const projectModules = {
  eccomerce_distribuidora: true,
};
