import {
  OperacionCarrito, ImportacionCatalogo, ImportacionCatalogoLote,
  CategoriaDistribuidora, MarcaDistribuidora, MarcaCategoriaDistribuidora,
  ProductoDistribuidora, VariedadDistribuidora,
  ListaPrecio, ListaPrecioLocalidad, ListaPrecioItem,
  CarritoDistribuidora, CarritoDistribuidoraItem,
  NotaPedido, NotaPedidoEstadoLog, NotaPedidoItem, NotaPedidoPago, NotaPedidoComprobante,
  PerfilClienteDistribuidora,
} from "./models/index.js";
import { catalogosDistribuidoraRouter } from "./routes/catalogos_distribuidora_router.js";
import { productoDistribuidoraRouter } from "./routes/producto_distribuidora_router.js";
import { carritoDistribuidoraRouter } from "./routes/carrito_distribuidora_router.js";
import { notaPedidoRouter } from "./routes/nota_pedido_router.js";
import { perfilClienteRouter } from "./routes/perfil_cliente_router.js";
import { importacionDistribuidoraRouter } from "./routes/importacion_distribuidora_router.js";
import { panelDistribuidoraRouter } from "./routes/panel_distribuidora_router.js";
import { marcasDistribuidoraRouter } from "./routes/marcas_distribuidora_router.js";
import { listasPrecioRouter } from "./routes/listas_precio_router.js";
import { clientesDistribuidoraRouter } from "./routes/clientes_distribuidora_router.js";
import { arranque_distribuidora } from "./arranque.js";
import { seed_distribuidora } from "./seed/index.js";

// Lo que el core necesita saber de este módulo (ver modulos/index.js).
export const moduloDistribuidora = {
  codigo: "eccomerce_distribuidora",
  descripcion: "Distribuidora",

  // Orden de creación: cada tabla después de las que referencia.
  modelos: [
    OperacionCarrito,
    ImportacionCatalogo,
    ImportacionCatalogoLote,
    CategoriaDistribuidora, // categoria_distribuidora (auto-referenciada)
    MarcaDistribuidora,     // marca_distribuidora (catálogo propio)
    MarcaCategoriaDistribuidora, // marca_categoria_distribuidora → marca_distribuidora, categoria_distribuidora
    ProductoDistribuidora,  // producto_distribuidora → categoria_distribuidora, marca_distribuidora
    VariedadDistribuidora,  // variedad_distribuidora → producto_distribuidora
    ListaPrecio,            // lista_precio (listas regionales; la General es el precio de la variedad)
    ListaPrecioLocalidad,   // lista_precio_localidad → lista_precio
    ListaPrecioItem,        // lista_precio_item → lista_precio, variedad_distribuidora
    CarritoDistribuidora,     // carrito_distribuidora → usuario
    CarritoDistribuidoraItem, // carrito_distribuidora_item → carrito_distribuidora, producto_distribuidora, variedad_distribuidora
    NotaPedido,     // nota_pedido → usuario
    NotaPedidoEstadoLog,
    NotaPedidoItem, // nota_pedido_item → nota_pedido, producto_distribuidora, variedad_distribuidora
    NotaPedidoPago, // nota_pedido_pago → nota_pedido, usuario
    NotaPedidoComprobante, // nota_pedido_comprobante → nota_pedido, usuario, nota_pedido_pago
    PerfilClienteDistribuidora, // perfil_cliente_distribuidora → usuario
  ],

  rutas: [
    ["/distribuidora/catalogos", catalogosDistribuidoraRouter],     // categorías (jerárquicas)
    ["/distribuidora/productos", productoDistribuidoraRouter],      // productos + variedades (precio/stock propio)
    ["/distribuidora/carrito", carritoDistribuidoraRouter],         // "nota de pedido" en construcción
    ["/distribuidora/notas-pedido", notaPedidoRouter],              // pedidos ya enviados (inmutables)
    ["/distribuidora/mi-perfil", perfilClienteRouter],              // CUIT/dirección — se pide al enviar el primer pedido
    ["/distribuidora/importacion", importacionDistribuidoraRouter], // carga masiva de productos desde Excel/CSV
    ["/distribuidora/panel", panelDistribuidoraRouter],             // resumen del panel de gestión
    ["/distribuidora/marcas", marcasDistribuidoraRouter],           // marcas y dónde se ofrecen
    ["/distribuidora/listas-precio", listasPrecioRouter],           // listas de precios regionales
    ["/distribuidora/clientes", clientesDistribuidoraRouter],       // listado de clientes con datos completos
  ],

  arranque: arranque_distribuidora,
  seed: seed_distribuidora,
};
