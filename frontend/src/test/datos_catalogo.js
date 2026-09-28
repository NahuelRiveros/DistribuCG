// Datos de ejemplo con la misma forma que devuelve el API del catálogo.

export const categoriasEjemplo = [
  { id: 1, nombre: "Almacén", slug: "almacen", padre_id: null, orden: 0, cantidad_productos: 0 },
  { id: 2, nombre: "Galletitas", slug: "galletitas", padre_id: 1, orden: 0, cantidad_productos: 1 },
  { id: 3, nombre: "Bebidas", slug: "bebidas", padre_id: null, orden: 0, cantidad_productos: 1 },
];

export function productoEjemplo(extra = {}) {
  return {
    id: 10,
    categoria_id: 2,
    nombre: "Galletitas Oreo",
    slug: "galletitas-oreo",
    marca: "Oreo",
    descripcion: "Galletitas de chocolate rellenas.",
    activo: true,
    publicado: true,
    categoria: { id: 2, nombre: "Galletitas", slug: "galletitas" },
    imagenes: [],
    variantes: [
      { id: 100, producto_id: 10, nombre: "118 g", sku: "ORE-118", precio: "1000.00", precio_anterior: null, iva_porcentaje: "21.00", activo: true, atributos: {}, controla_stock: false },
      { id: 101, producto_id: 10, nombre: "Familiar 300 g", sku: "ORE-300", precio: "2000.00", precio_anterior: "2500.00", iva_porcentaje: "21.00", activo: true, atributos: {}, controla_stock: false },
    ],
    ...extra,
  };
}

export const paginacionDe = (lista) => ({ pagina: 1, limite: 20, total: lista.length, total_paginas: 1 });
