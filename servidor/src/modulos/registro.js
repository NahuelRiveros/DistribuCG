import { saludRutas } from "./salud/salud_rutas.js";
import { authRutas } from "./usuarios/auth_rutas.js";
import { usuariosRutas } from "./usuarios/usuarios_rutas.js";
import { configuracionRutas } from "./configuracion/configuracion_rutas.js";
import { catalogoRutas } from "./catalogo/catalogo_rutas.js";
import { stockRutas } from "./stock/stock_rutas.js";
import { tiendaRutas } from "./tienda/tienda_rutas.js";
import { pedidosPanelRutas } from "./tienda/pedidos_panel_rutas.js";
import { cajaRutas } from "./caja/caja_rutas.js";

// Rutas de cada módulo bajo /api. `modulo: null` = siempre activo (núcleo).
// Los módulos de negocio se suman acá con su código de proyecto.config.js,
// y además cada router usa requerirModulo() como segunda barrera.
export const rutasDeModulos = [
  { prefijo: "/salud", rutas: saludRutas, modulo: null },
  { prefijo: "/auth", rutas: authRutas, modulo: null },
  { prefijo: "/usuarios", rutas: usuariosRutas, modulo: null },
  { prefijo: "/configuracion", rutas: configuracionRutas, modulo: null },
  { prefijo: "/catalogo", rutas: catalogoRutas, modulo: "catalogo" },
  { prefijo: "/stock", rutas: stockRutas, modulo: "stock" },
  { prefijo: "/tienda", rutas: tiendaRutas, modulo: "tienda" },
  { prefijo: "/pedidos", rutas: pedidosPanelRutas, modulo: "tienda" },
  { prefijo: "/caja", rutas: cajaRutas, modulo: "caja" },
];
