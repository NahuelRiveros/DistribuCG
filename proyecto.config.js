// ÚNICO switch del proyecto. Lo leen frontend y servidor (vía compartido/proyecto.js).
// Nunca poner secretos acá: este archivo termina dentro del bundle del navegador.

// Medios de pago: los usan el checkout de la tienda, los cobros de pedidos y la Caja.
//   en_tienda: el cliente lo puede elegir al confirmar el pedido
//   descuento: % que se descuenta del total del pedido (lo calcula el servidor)
//   detalle:   aclaración que ve el cliente
//   logos:     claves de frontend/src/assets/medios_pago (visa, mastercard, cabal, naranja_x, mercado_pago, go_cuotas)
const MEDIOS_PAGO = [
  { valor: "transferencia", etiqueta: "Transferencia bancaria", en_tienda: true, descuento: 10, detalle: "Te mostramos el CBU y el alias al confirmar el pedido." },
  { valor: "efectivo", etiqueta: "Efectivo", en_tienda: true, descuento: 0, detalle: "Pagás al retirar o al recibir el pedido." },
  { valor: "mercado_pago", etiqueta: "Mercado Pago", en_tienda: true, descuento: 0, detalle: "Te enviamos un link de pago.", logos: ["mercado_pago"] },
  {
    valor: "tarjeta",
    etiqueta: "Tarjeta de crédito o débito",
    en_tienda: true,
    descuento: 0,
    detalle: "Te enviamos un link de pago o pagás con posnet al retirar.",
    logos: ["visa", "mastercard", "cabal", "naranja_x"],
  },
  { valor: "otro", etiqueta: "Otro medio", en_tienda: false, descuento: 0 },
];

export const proyecto = {
  // Carpeta de frontend/src/clientes/ con marca, tema, Home, navbar y footer.
  cliente: "demo",

  // Define "qué día" es un cobro o un movimiento (un cobro a las 23:30 no pasa al día siguiente).
  zona_horaria: "America/Argentina/Buenos_Aires",

  // Módulos de negocio. Apagado = sin rutas en el servidor, sin pantallas ni navbar.
  // catalogo/stock/tienda se implementan en los pasos 3 a 5 de docs/WORKFLOW.md.
  modulos: {
    catalogo: true,
    stock: true,
    tienda: true,
    caja: true,
    pagos_online: false,
  },

  usuarios: {
    registro_publico: true,
    contrasena_min: 8,
    contrasena_max: 72, // límite de bcrypt
  },

  catalogo: {
    // Cómo se llama "lo que se compra" en este rubro: "Presentación", "Variante", "Talle y color"...
    etiqueta_variante: "Presentación",
    etiqueta_variantes: "Presentaciones",
    iva_por_defecto: 21,
    alicuotas_iva: [21, 10.5, 27, 0],
    productos_por_pagina: 24,
    max_niveles_categoria: 10,
    max_imagenes_producto: 10,
  },

  tienda: {
    catalogo_publico: true,
    carrito_invitado: true,
    precios_con_iva: true,
    max_lineas_carrito: 200,
    max_cantidad_item: 9999,
    dias_vida_carrito: 15,
    // null = sin mínimo. Ej: 50000 para exigir un pedido mínimo de $ 50.000 (con IVA).
    pedido_minimo: null,
    // La entrega se coordina con el cliente: no se calcula costo de envío.
    modalidades_entrega: [
      { valor: "envio", etiqueta: "Envío a domicilio" },
      { valor: "retiro", etiqueta: "Retiro en el local" },
    ],
  },

  stock: {
    // Cuándo se descuenta el stock de un pedido: "envio_pedido" | "confirmacion" | "entrega"
    descontar_en: "confirmacion",
    // Tienda: false = "Disponible / Últimas unidades / Sin stock"; true = "Quedan N".
    mostrar_cantidad_en_tienda: false,
    // Tienda: true = los productos sin stock no se listan; false = se muestran marcados.
    ocultar_sin_stock: false,
    motivos_ajuste: ["Conteo de inventario", "Rotura", "Vencimiento", "Robo o faltante", "Corrección de carga", "Otro"],
  },

  // Flujo comercial (probado en DistribuCG). El cobro es independiente del estado:
  // se puede preparar o entregar "a cuenta".
  pedidos: {
    estados: {
      pendiente: { etiqueta: "Recibido", tono: "warning" },
      en_preparacion: { etiqueta: "En preparación", tono: "info" },
      entregado: { etiqueta: "Entregado", tono: "success" },
      cancelado: { etiqueta: "Cancelado", tono: "danger" },
    },
    transiciones: {
      pendiente: ["en_preparacion", "cancelado"],
      en_preparacion: ["pendiente", "entregado", "cancelado"],
      entregado: ["en_preparacion"],
      cancelado: ["pendiente"],
    },
    // Estados a los que no se puede avanzar con el cobro pendiente. Ej: ["entregado"].
    estados_requieren_cobro: [],
    // Cambios "hacia atrás" o cancelaciones que exigen motivo.
    motivo_requerido: [
      "en_preparacion:pendiente",
      "entregado:en_preparacion",
      "cancelado:pendiente",
      "pendiente:cancelado",
      "en_preparacion:cancelado",
    ],
    metodos_cobro: MEDIOS_PAGO,
  },

  // Caja: ingresos y egresos del negocio. Los cobros de pedidos entran solos como ingresos
  // (si el módulo tienda está activo); lo demás se carga a mano con su categoría.
  // Cómo se paga: se muestra en la ficha del producto y en el pedido.
  // ⚠️ TODO lo marcado EJEMPLO son datos de muestra: reemplazarlos por los reales antes de publicar.
  pagos: {
    medios: MEDIOS_PAGO,
    // Datos para transferir (no son secretos: se le muestran al cliente). null = no se muestran.
    datos_transferencia: {
      titular: "EJEMPLO S.A.",
      cuit: "30-00000000-7",
      banco: "Banco EJEMPLO",
      cbu: "0000000000000000000000",
      alias: "EJEMPLO.TIENDA.DEMO",
    },
    // Financiación. interes: % de recargo sobre el precio (0 = sin interés).
    // Con interés, la ley exige informar el CFT: completar "cft" (ej. "CFTEA 45,5 %").
    financiacion: [
      {
        nombre: "Mercado Pago",
        logos: ["mercado_pago"],
        medio: "mercado_pago",
        planes: [
          { cuotas: 3, interes: 0 },
          { cuotas: 6, interes: 0 },
          //{ cuotas: 12, interes: 35, cft: "CFTEA EJEMPLO" },
        ],
      },
      {
        nombre: "Tarjetas de crédito",
        logos: ["visa", "mastercard", "cabal", "naranja_x"],
        medio: "tarjeta",
        planes: [
          { cuotas: 3, interes: 0 },
          //{ cuotas: 6, interes: 15, cft: "CFTEA EJEMPLO" },
        ],
      },
      {
        nombre: "GoCuotas (tarjeta de débito)",
        logos: ["go_cuotas"],
        medio: "tarjeta",
        planes: [{ cuotas: 4, interes: 0 }],
      },
    ],
    // Promociones bancarias. dias: vacío = todos los días. hasta: último día vigente (AAAA-MM-DD).
    promociones: [
      { banco: "Banco EJEMPLO", detalle: "20% de reintegro con tarjeta de crédito", dias: ["jueves"], hasta: "2026-12-31", tope: "Tope $ 10.000 por mes" },
    ],
    // Cinta destacada en la ficha. null = se arma sola con el mejor descuento y la mejor cuota sin interés.
    cinta: null,
  },

  caja: {
    medios: MEDIOS_PAGO,
    // Etiqueta de los cobros de pedidos en el balance y el calendario.
    etiqueta_ventas_tienda: "Ventas de la tienda",
  },
};
