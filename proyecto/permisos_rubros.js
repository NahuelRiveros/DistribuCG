// Permisos de los rubros de ESTE proyecto (los del core están en core/permisos_config.js,
// que los suma a la misma lista). Un proyecto sin rubros deja PERMISOS_DE_RUBROS vacío.
// Van aunque el rubro esté apagado en gate_config.js: el arranque borra los códigos que
// salen de la lista y, con ellos, lo que se haya tildado en el panel (PER-31).
// ⚠️ No cambiar un `codigo` existente por el mismo motivo.

// ── Distribuidora ───────────────────────────────────────────────────────────
const DISTRIBUIDORA = {
  grupos: [
    { codigo: "pedidos", nombre: "Pedidos" },
    { codigo: "cobros", nombre: "Cobros" },
    { codigo: "catalogo", nombre: "Catálogo" },
    { codigo: "clientes", nombre: "Clientes" },
  ],
  permisos: [
    { codigo: "pedidos.ver", grupo: "pedidos", nombre: "Ver pedidos", descripcion: "Notas de pedido, comprobantes, lista de carga, exportar y resumen del panel.", porDefecto: ["supervisor", "vendedor"] },
    { codigo: "pedidos.gestionar", grupo: "pedidos", nombre: "Cambiar estados", descripcion: "Confirmar, preparar, entregar, cancelar o reabrir pedidos.", porDefecto: ["supervisor", "vendedor"], requiere: ["pedidos.ver"] },
    { codigo: "cobros.gestionar", grupo: "cobros", nombre: "Registrar cobros", descripcion: "Registrar y anular cobros; aceptar o rechazar comprobantes.", porDefecto: ["supervisor"], requiere: ["pedidos.ver"] },
    // Antes solo el dueño veía estos montos: de entrada no lo tiene ningún rol.
    { codigo: "ventas.ver", grupo: "cobros", nombre: "Ver ventas y saldos", descripcion: "Ventas del día y del mes y saldo por cobrar en el inicio del panel.", porDefecto: [] },
    { codigo: "productos.editar", grupo: "catalogo", nombre: "Editar artículos y stock", descripcion: "Artículos, familias, categorías, marcas y stock.", porDefecto: ["supervisor"] },
    { codigo: "precios.editar", grupo: "catalogo", nombre: "Cambiar precios", descripcion: "Precios de los artículos, ajuste masivo, listas de precios e importación.", porDefecto: ["supervisor"] },
    // CLI-14 sin respuesta del cliente: de entrada solo admin (lo más reservado); se tilda en el panel a quien corresponda.
    { codigo: "clientes.ver", grupo: "clientes", nombre: "Ver clientes", descripcion: "Listado de clientes con sus datos de contacto, facturación y entrega.", porDefecto: [] },
  ],
};

export const PERMISOS_DE_RUBROS = [DISTRIBUIDORA];
