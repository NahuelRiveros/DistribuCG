// GATE MAESTRO — qué tipo de proyecto es este cliente.
//
// Tocar estos 3 valores alcanza para prender/apagar un módulo entero
// (rutas, navbar, todo) — es lo primero que se edita al arrancar un
// proyecto nuevo para un cliente. Ejemplos:
//   - Solo gimnasio:        { gym: true,  kinesiologia: false, eccomerce_indumentaria: false }
//   - Gimnasio + kinesio:   { gym: true,  kinesiologia: true,  eccomerce_indumentaria: false }
//   - Solo tienda de ropa:  { gym: false, kinesiologia: false, eccomerce_indumentaria: true  }
//
// gym y kinesiología no tienen su propio *_config.js — se lee este objeto
// directo (projectModules.gym / .kinesiologia) donde haga falta, porque no
// tienen ningún ajuste fino propio. cart_config.js y catalog_config.js sí
// leen su flag principal de acá pero además agregan más campos (métodos de
// pago, si el checkout está listo, textos del menú de catálogo, etc.) — para
// esos ajustes finos DENTRO de un módulo ya habilitado se sigue tocando el
// config específico de ese módulo, este archivo es solo el "¿lo tiene o no
// lo tiene?".
export const projectModules = {
  gym: false,
  kinesiologia: false,
  eccomerce_indumentaria: false,
  eccomerce_distribuidora: true,
};
