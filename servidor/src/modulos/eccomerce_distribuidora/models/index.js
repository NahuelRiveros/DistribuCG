/**
 * Modelos y asociaciones del módulo eccomerce_distribuidora. Re-exporta los
 * del core para que el módulo importe todo desde acá; el core no conoce
 * estos modelos.
 */
import { aplicarRelaciones } from "../../../core/models/common/relaciones.js";
import { Usuario } from "../../../core/models/index.js";
import { ImportacionCatalogo, ImportacionCatalogoLote } from "./importacion_catalogo.js";
import { NotaPedidoEstadoLog } from "./nota_pedido_estado_log.js";
import { OperacionCarrito } from "./operacion_carrito.js";
import { CategoriaDistribuidora }   from "./categoria_distribuidora.js";
import { ProductoDistribuidora }    from "./producto_distribuidora.js";
import { MarcaDistribuidora, MarcaCategoriaDistribuidora } from "./marca_distribuidora.js";
import { ListaPrecio, ListaPrecioLocalidad, ListaPrecioItem } from "./lista_precio.js";
import { VariedadDistribuidora }    from "./variedad_distribuidora.js";
import { CarritoDistribuidora }     from "./carrito_distribuidora.js";
import { CarritoDistribuidoraItem } from "./carrito_distribuidora_item.js";
import { NotaPedido }               from "./nota_pedido.js";
import { NotaPedidoItem }           from "./nota_pedido_item.js";
import { NotaPedidoPago }           from "./nota_pedido_pago.js";
import { NotaPedidoComprobante }    from "./nota_pedido_comprobante.js";
import { PerfilClienteDistribuidora } from "./perfil_cliente_distribuidora.js";

aplicarRelaciones([
  { tipo: "hasMany", from: NotaPedido, to: NotaPedidoEstadoLog, foreignKey: "nota_pedido_id", as: "historial_estados" },
  { tipo: "belongsTo", from: NotaPedidoEstadoLog, to: Usuario, foreignKey: "usuario_id", as: "autor" },

  // ─── CategoriaDistribuidora ↔ CategoriaDistribuidora (jerárquica) ───────
  { tipo: "belongsTo", from: CategoriaDistribuidora, to: CategoriaDistribuidora, foreignKey: "padre_id", as: "padre" },
  { tipo: "hasMany",   from: CategoriaDistribuidora, to: CategoriaDistribuidora, foreignKey: "padre_id", as: "subcategorias" },

  // ─── ProductoDistribuidora ↔ CategoriaDistribuidora ─────────────────────
  { tipo: "belongsTo", from: ProductoDistribuidora,  to: CategoriaDistribuidora, foreignKey: "categoria_id", as: "categoria" },
  { tipo: "hasMany",   from: CategoriaDistribuidora, to: ProductoDistribuidora,  foreignKey: "categoria_id", as: "productos" },

  // ─── MarcaDistribuidora ↔ ProductoDistribuidora / categorías donde se ofrece ──
  { tipo: "belongsTo", from: ProductoDistribuidora, to: MarcaDistribuidora, foreignKey: "marca_id", as: "marca_ref" },
  { tipo: "hasMany",   from: MarcaDistribuidora, to: ProductoDistribuidora, foreignKey: "marca_id", as: "productos" },
  { tipo: "hasMany",   from: MarcaDistribuidora, to: MarcaCategoriaDistribuidora, foreignKey: "marca_id", as: "categorias" },
  { tipo: "belongsTo", from: MarcaCategoriaDistribuidora, to: CategoriaDistribuidora, foreignKey: "categoria_id", as: "categoria" },

  // ─── ListaPrecio ↔ localidades / precios por presentación ───────────────
  { tipo: "hasMany",   from: ListaPrecio, to: ListaPrecioLocalidad, foreignKey: "lista_id", as: "localidades" },
  { tipo: "hasMany",   from: ListaPrecio, to: ListaPrecioItem, foreignKey: "lista_id", as: "items" },
  { tipo: "belongsTo", from: ListaPrecioItem, to: VariedadDistribuidora, foreignKey: "variedad_id", as: "variedad" },

  // ─── VariedadDistribuidora ↔ ProductoDistribuidora (una fila = una variedad) ──
  { tipo: "belongsTo", from: VariedadDistribuidora, to: ProductoDistribuidora, foreignKey: "producto_id", as: "producto" },
  { tipo: "hasMany",   from: ProductoDistribuidora, to: VariedadDistribuidora, foreignKey: "producto_id", as: "variedades" },

  // ─── CarritoDistribuidora ↔ Usuario (1:1) ────────────────────────────────
  { tipo: "belongsTo", from: CarritoDistribuidora, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
  { tipo: "hasOne",    from: Usuario, to: CarritoDistribuidora, foreignKey: "usuario_id", as: "carrito_distribuidora" },

  // ─── CarritoDistribuidoraItem ↔ CarritoDistribuidora / ProductoDistribuidora / VariedadDistribuidora ──
  { tipo: "belongsTo", from: CarritoDistribuidoraItem, to: CarritoDistribuidora, foreignKey: "carrito_id",  as: "carrito" },
  { tipo: "hasMany",   from: CarritoDistribuidora,     to: CarritoDistribuidoraItem, foreignKey: "carrito_id", as: "items" },
  { tipo: "belongsTo", from: CarritoDistribuidoraItem, to: ProductoDistribuidora, foreignKey: "producto_id", as: "producto" },
  { tipo: "belongsTo", from: CarritoDistribuidoraItem, to: VariedadDistribuidora, foreignKey: "variedad_id", as: "variedad" },

  // ─── NotaPedido ↔ Usuario (1:N) ──────────────────────────────────────────
  { tipo: "belongsTo", from: NotaPedido, to: Usuario,    foreignKey: "usuario_id", as: "usuario" },
  { tipo: "hasMany",   from: Usuario,    to: NotaPedido, foreignKey: "usuario_id", as: "notas_pedido" },

  // ─── NotaPedidoItem ↔ NotaPedido / ProductoDistribuidora / VariedadDistribuidora ──
  { tipo: "belongsTo", from: NotaPedidoItem, to: NotaPedido, foreignKey: "nota_pedido_id", as: "nota_pedido" },
  { tipo: "hasMany",   from: NotaPedido,     to: NotaPedidoItem, foreignKey: "nota_pedido_id", as: "items" },
  { tipo: "belongsTo", from: NotaPedidoItem, to: ProductoDistribuidora, foreignKey: "producto_id", as: "producto" },
  { tipo: "belongsTo", from: NotaPedidoItem, to: VariedadDistribuidora, foreignKey: "variedad_id", as: "variedad" },

  // ─── NotaPedidoPago — ledger de pagos (soporta pagos parciales) ─────────
  { tipo: "belongsTo", from: NotaPedidoPago, to: NotaPedido, foreignKey: "nota_pedido_id", as: "nota_pedido" },
  { tipo: "hasMany",   from: NotaPedido,     to: NotaPedidoPago, foreignKey: "nota_pedido_id", as: "pagos" },
  { tipo: "belongsTo", from: NotaPedidoPago, to: Usuario, foreignKey: "registrado_por", as: "registrado_por_usuario" },
  { tipo: "belongsTo", from: NotaPedidoPago, to: Usuario, foreignKey: "anulado_por",    as: "anulado_por_usuario" },

  // ─── NotaPedidoComprobante — transferencias que adjunta el comprador ────
  { tipo: "hasMany",   from: NotaPedido, to: NotaPedidoComprobante, foreignKey: "nota_pedido_id", as: "comprobantes" },
  { tipo: "belongsTo", from: NotaPedidoComprobante, to: NotaPedido, foreignKey: "nota_pedido_id", as: "nota_pedido" },
  { tipo: "belongsTo", from: NotaPedidoComprobante, to: Usuario, foreignKey: "revisado_por", as: "revisado_por_usuario" },

  // ─── PerfilClienteDistribuidora ↔ Usuario (1:1) ──────────────────────────
  { tipo: "belongsTo", from: PerfilClienteDistribuidora, to: Usuario, foreignKey: "usuario_id", as: "usuario" },
  { tipo: "hasOne",    from: Usuario, to: PerfilClienteDistribuidora, foreignKey: "usuario_id", as: "perfil_distribuidora" },
]);

export * from "../../../core/models/index.js";
export {
  OperacionCarrito,
  NotaPedidoEstadoLog,
  ImportacionCatalogo,
  ImportacionCatalogoLote,
  CategoriaDistribuidora,
  ProductoDistribuidora,
  VariedadDistribuidora,
  MarcaDistribuidora,
  MarcaCategoriaDistribuidora,
  ListaPrecio,
  ListaPrecioLocalidad,
  ListaPrecioItem,
  CarritoDistribuidora,
  CarritoDistribuidoraItem,
  NotaPedido,
  NotaPedidoItem,
  NotaPedidoPago,
  NotaPedidoComprobante,
  PerfilClienteDistribuidora,
};
