import test from "node:test";
import assert from "node:assert/strict";
import { precioDesdeCosto, desglosePrecio, rentabilidadResultante, debajoDelCosto, validarCostoYRentabilidad } from "../../rubros/eccomerce_distribuidora/precio_desde_costo.js";
import { validarVariedad } from "../src/modulos/eccomerce_distribuidora/services/articulo_rules.js";

test("PRE-61: costo × (1 + rentabilidad) × (1 + IVA), en pesos enteros, con IVA 0, 10,5, 21 y 27", () => {
  assert.equal(precioDesdeCosto({ costo: 1000, rentabilidad: 30, iva: 21 }), 1573);
  assert.equal(precioDesdeCosto({ costo: 1000, rentabilidad: 30, iva: 0 }), 1300);
  assert.equal(precioDesdeCosto({ costo: 1000, rentabilidad: 30, iva: 10.5 }), 1437); // 1436,5 redondea para arriba
  assert.equal(precioDesdeCosto({ costo: 1000, rentabilidad: 30, iva: 27 }), 1651);
  assert.equal(precioDesdeCosto({ costo: 333.33, rentabilidad: 12.5, iva: 21 }), 454); // 453,74…
  assert.equal(precioDesdeCosto({ costo: 1000, rentabilidad: 0, iva: 21 }), 1210);
  assert.deepEqual(desglosePrecio({ costo: 1000, rentabilidad: 30, iva: 21 }), { precio: 1573, neto: 1300, iva: 273, ganancia: 300 });
});

test("PRE-63: la rentabilidad que deja un precio final, acotada a lo que se puede guardar", () => {
  assert.equal(rentabilidadResultante({ costo: 1000, precio: 1700, iva: 21 }), 40.5);
  assert.equal(rentabilidadResultante({ costo: 1000, precio: 1573, iva: 21 }), 30);
  assert.equal(rentabilidadResultante({ costo: 1000, precio: 800, iva: 21 }), -33.88);
  assert.equal(rentabilidadResultante({ costo: 1, precio: 9_999_999, iva: 0 }), 9999.99);
  for (const costo of [null, undefined, "", 0]) assert.equal(rentabilidadResultante({ costo, precio: 1000, iva: 21 }), null);
});

test("PRE-67: por debajo del costo es no cubrir el costo con IVA; sin costo o sin precio no se avisa", () => {
  assert.equal(debajoDelCosto({ costo: 1000, precio: 1209.99, iva: 21 }), true);
  assert.equal(debajoDelCosto({ costo: 1000, precio: 1210, iva: 21 }), false);
  assert.equal(debajoDelCosto({ costo: null, precio: 100, iva: 21 }), false);
  assert.equal(debajoDelCosto({ costo: 1000, precio: 0, iva: 21 }), false, "en $0 no está a la venta: no es pérdida");
});

test("PRE-69: costo mayor a 0 y hasta $99.999.999; rentabilidad de 0 a 1.000 % con 2 decimales", () => {
  assert.deepEqual(validarCostoYRentabilidad({ costo: "1000,5".replace(",", "."), rentabilidad: "30" }), { costo: 1000.5, rentabilidad: 30 });
  assert.deepEqual(validarCostoYRentabilidad({ costo: "", rentabilidad: null }), { costo: null, rentabilidad: null });
  for (const datos of [{ costo: 0 }, { costo: -5 }, { costo: 100_000_000 }, { costo: "abc" }]) assert.match(validarCostoYRentabilidad(datos).error, /costo neto/);
  for (const rentabilidad of [-1, 1000.01, 12.345]) assert.match(validarCostoYRentabilidad({ costo: 10, rentabilidad }).error, /rentabilidad/i);
  assert.match(validarCostoYRentabilidad({ costo: 10 }, { obligatorios: true }).error, /costo neto y la rentabilidad/);
});

test("PRE-62: la ficha en \"Desde el costo\" guarda el precio calculado, no el que manda la pantalla", () => {
  const { datos } = validarVariedad({ modo_precio: "costo", costo_neto: 1000, rentabilidad: 30, iva_porcentaje: 21, precio: 1 });
  assert.deepEqual([datos.precio, datos.costo_neto, datos.rentabilidad], [1573, 1000, 30]);
  assert.match(validarVariedad({ modo_precio: "costo", costo_neto: 1000 }).error, /costo neto y la rentabilidad/);
  // "Precio final": sin campos de costo no los toca (quien no cambia precios no los manda).
  const final = validarVariedad({ precio: 900, iva_porcentaje: 21 }).datos;
  assert.ok(!("costo_neto" in final) && !("rentabilidad" in final));
  assert.equal(validarVariedad({ precio: 900, costo_neto: "" }).datos.costo_neto, null, "vacío lo borra");
});
