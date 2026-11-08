// Permisos del rubro distribuidora. Los junta permisos_config.js (raíz) con los del core;
// mismos campos que allí. Cambiar un `codigo` borra sus asignaciones en la base.
export const permisosDistribuidora = {
  codigo: "eccomerce_distribuidora",
  grupos: [
    { codigo: "pedidos", nombre: "Pedidos" },
    { codigo: "cobros", nombre: "Cobros" },
    { codigo: "catalogo", nombre: "Catálogo" },
  ],
  permisos: [
    { codigo: "pedidos.ver", grupo: "pedidos", nombre: "Ver pedidos", descripcion: "Notas de pedido, comprobantes, lista de carga, exportar y resumen del panel.", porDefecto: ["supervisor", "vendedor"] },
    { codigo: "pedidos.gestionar", grupo: "pedidos", nombre: "Cambiar estados", descripcion: "Confirmar, preparar, entregar, cancelar o reabrir pedidos.", porDefecto: ["supervisor", "vendedor"], requiere: ["pedidos.ver"] },
    { codigo: "cobros.gestionar", grupo: "cobros", nombre: "Registrar cobros", descripcion: "Registrar y anular cobros; aceptar o rechazar comprobantes.", porDefecto: ["supervisor"], requiere: ["pedidos.ver"] },
    // Antes solo el dueño veía estos montos: de entrada no lo tiene ningún rol.
    { codigo: "ventas.ver", grupo: "cobros", nombre: "Ver ventas y saldos", descripcion: "Ventas del día y del mes y saldo por cobrar en el inicio del panel.", porDefecto: [] },
    { codigo: "productos.editar", grupo: "catalogo", nombre: "Editar artículos y stock", descripcion: "Artículos, familias, categorías, marcas y stock.", porDefecto: ["supervisor"] },
    { codigo: "precios.editar", grupo: "catalogo", nombre: "Cambiar precios", descripcion: "Precios de los artículos, ajuste masivo, listas de precios e importación.", porDefecto: ["supervisor"] },
  ],
};
