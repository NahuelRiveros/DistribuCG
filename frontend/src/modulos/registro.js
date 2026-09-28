import { proyecto } from "compartido/proyecto.js";
import { moduloCaja } from "./caja/modulo.jsx";
import { moduloCatalogo } from "./catalogo/modulo.jsx";
import { moduloConfiguracion } from "./configuracion/modulo.jsx";
import { moduloStock } from "./stock/modulo.jsx";
import { moduloTienda } from "./tienda/modulo.jsx";
import { moduloUsuarios } from "./usuarios/modulo.jsx";

// Módulos de negocio del frontend. Cada uno aporta (todo opcional):
//   navbar        → links en el navbar de la tienda
//   rutasPublicas → rutas del sitio
//   rutasAdmin    → rutas dentro de /admin
//   menuAdmin     → sección del menú lateral del panel { titulo, icono, roles, items: [{ etiqueta, a, icono, exacto? }] }
//                   con submenu: { raiz } se muestra como un solo ítem y, al entrar, el menú muestra solo sus pestañas
//   resumenAdmin  → componente con tarjetas para el inicio del panel
//   navbarExtras  → componentes en el navbar de la tienda (ej. ícono del carrito)
//   enlacesCuenta → links de la cuenta del usuario con sesión (ej. "Mis pedidos")
//   globales      → componentes sin interfaz montados en el layout de la tienda
//   accionesProducto → componentes debajo del precio en el detalle de producto ({ producto, variante })
// Para sumar un módulo (ej. stock): crear modulos/stock/modulo.jsx y agregarlo a esta lista.
// El orden define el orden en el menú del panel. `siempre: true` = núcleo (no se apaga).
const TODOS = [moduloTienda, moduloCatalogo, moduloStock, moduloCaja, moduloConfiguracion, moduloUsuarios];

export const modulosActivos = TODOS.filter((modulo) => modulo.siempre || proyecto.modulos[modulo.codigo]);
