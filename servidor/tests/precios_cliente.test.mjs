import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { leerHojasCliente, leerListaCliente } from "../src/modulos/eccomerce_distribuidora/services/importacion/lector_lista_cliente.js";
import {
  armarPlanPrecios, cambioAAplicar, codigoCliente, extraerPrecios, precioCliente, restarMeses, resumirPlan, similitudNombre,
} from "../src/modulos/eccomerce_distribuidora/services/importacion/lista_cliente.js";

// Igual que el Excel del cliente: títulos, encabezado, secciones y dos bloques por fila.
async function libroDePrueba() {
  const libro = new ExcelJS.Workbook();
  const lista = libro.addWorksheet("LISTA");
  lista.addRow(["DISTRIBUIDORA DE EJEMPLO"]);
  lista.addRow(["CONSULTAR PRECIOS Y STOCK AL VENDEDOR"]);
  lista.addRow(["COD", "DESCRIPCIÓN", "PRECIO", "COD", "DESCRIPCIÓN", "PRECIO"]);
  lista.addRow(["GOLOSINAS", "GOLOSINAS", "GOLOSINAS"]);
  lista.addRow(["000144  ", "Car.Arcor Butt.Toff.Dulc.Leche x822g      ", 12972.8949, "001232  ", "Vodka New Stile orig.6x1 lts", 3437.46]);
  lista.addRow(['"006021', "VINO CUATRO MONOS LOCOS 4*750cc", 13951.61, "'006137", "LA HUERTA PURE DE TOMATE 12x520g", " "]);
  lista.addRow(["000628  ", "Producto sin precio", null, "000100", "Texto como precio", "consultar"]);
  const exportados = libro.addWorksheet("Datos Exportados");
  exportados.addRow(["000144  ", "Car.Arcor Butt.Toff.Dulc.Leche x822g", 8875.2959]);
  exportados.addRow(["001232  ", "Vodka New Stile orig.6x1 lts", 3999]);
  libro.addWorksheet("Hoja1").addRow(["PROMOCIONES", "5 BULTOS", 0.07]);
  return Buffer.from(await libro.xlsx.writeBuffer());
}

test("PRE-31: lee los dos bloques de LISTA, limpia códigos con comillas y espacios, y un precio vacío o con texto vale 0", async () => {
  const { hojas, disponibles } = await leerHojasCliente(await libroDePrueba(), ["LISTA", "Datos Exportados"]);
  assert.deepEqual(disponibles, ["LISTA", "Datos Exportados", "Hoja1"]);
  assert.equal(hojas.Hoja1, undefined); // solo se leen las hojas pedidas
  const filas = extraerPrecios(hojas.LISTA);
  assert.deepEqual(filas.map((f) => [f.cod, f.precio]), [
    ["000144", 12972.89], ["001232", 3437.46], ["006021", 13951.61], ["006137", 0], ["000628", 0], ["000100", 0],
  ]);
  assert.equal(filas[0].descripcion, "Car.Arcor Butt.Toff.Dulc.Leche x822g");
  assert.equal(filas[0].fila, 5);
  // Un precio numérico de 6 cifras nunca se confunde con un código.
  assert.equal(codigoCliente(123456), null);
  assert.equal(codigoCliente("12345"), null);
  assert.equal(precioCliente("1234,5"), 1234.5);
  assert.equal(precioCliente(-5), 0);
  assert.equal(precioCliente(1.005), 1.01);
});

test("PRE-30: solo acepta el Excel .xlsx", async () => {
  await assert.rejects(leerListaCliente(Buffer.from("x"), "lista.xls"), /\.xlsx/);
});

const variante = (id, cod, precio, extra = {}) => ({
  id, producto_id: extra.producto_id ?? id, cod_ref: cod, precio, nombre: null, producto_nombre: extra.nombre ?? "Articulo " + cod,
  marca: null, producto_activo: extra.activo ?? true, inactivo_por_lista: extra.inactivo_por_lista ?? false, sin_precio_lista_desde: extra.desde ?? null,
});
const enLista = (cod, precio, descripcion = "Articulo " + cod, fila = 1) => ({ cod, precio, descripcion, fila });
const HOY = "2026-11-19";
const planDe = (lista, variantes, comparacion = []) => armarPlanPrecios({ lista, comparacion, variantes, hoy: HOY });

test("PRE-32 y PRE-35: sube, baja y sin cambio solo tocan el precio; lo que falta en un lado se informa", () => {
  const plan = planDe(
    [enLista("000001", 110), enLista("000002", 95), enLista("000003", 50), enLista("000009", 300)],
    [variante(1, "000001", 100), variante(2, "000002", 100), variante(3, "000003", 50), variante(4, "000004", 70)],
  );
  const por = Object.fromEntries(plan.map((f) => [f.cod, f]));
  assert.deepEqual([por["000001"].estado, por["000001"].precioNuevo, por["000001"].variacion], ["sube", 110, 10]);
  assert.equal(por["000002"].estado, "baja");
  assert.equal(por["000003"].estado, "sin_cambio");
  assert.equal(por["000009"].estado, "no_cargado");
  assert.equal(por["000004"].estado, "no_figura");
  assert.deepEqual(resumirPlan(plan), { total: 5, sube: 1, baja: 1, sin_cambio: 1, no_cargado: 1, no_figura: 1 });
  // Lo que se aplica: solo precio; nada de oferta (el precio anterior no aparece).
  const c = cambioAAplicar(por["000002"], undefined, { hoy: HOY });
  assert.deepEqual([c.precioAntes, c.precioNuevo, c.accionProducto], [100, 95, null]);
  assert.equal(cambioAAplicar(por["000003"], undefined, { hoy: HOY }), null);
  assert.equal(cambioAAplicar(por["000009"], undefined, { hoy: HOY }), null);
});

test("PRE-33: gana el mayor de Datos Exportados, salvo que LISTA diga 0 o el código esté repetido allá con precios distintos", () => {
  const plan = planDe(
    [enLista("000001", 100), enLista("000002", 0), enLista("000003", 100), enLista("000004", 120)],
    [variante(1, "000001", 100), variante(2, "000002", 90), variante(3, "000003", 100), variante(4, "000004", 100)],
    [enLista("000001", 115), enLista("000002", 500), enLista("000003", 110), enLista("000003", 130), enLista("000004", 110)],
  );
  const por = Object.fromEntries(plan.map((f) => [f.cod, f]));
  assert.deepEqual([por["000001"].precioNuevo, por["000001"].origen], [115, "Datos Exportados"]);
  assert.equal(por["000002"].estado, "sin_precio");      // LISTA en 0: dejó de venderse
  assert.equal(por["000003"].estado, "sin_cambio");      // repetido en Datos Exportados: se ignora
  assert.deepEqual([por["000004"].precioNuevo, por["000004"].origen], [120, "LISTA"]); // LISTA ya es mayor
});

test("PRE-34 y PRE-34b: precio 0 no toca el precio y anota la fecha; a los 6 meses desactiva; con precio de nuevo vuelve", () => {
  const plan = planDe(
    [enLista("000001", 0), enLista("000002", 0), enLista("000003", 0), enLista("000004", 210), enLista("000005", 0)],
    [
      variante(1, "000001", 100),
      variante(2, "000002", 100, { desde: "2026-05-19" }),            // justo 6 meses
      variante(3, "000003", 100, { desde: "2026-05-20" }),            // un día menos
      variante(4, "000004", 200, { activo: false, inactivo_por_lista: true, desde: "2026-01-01" }),
      variante(5, "000005", 100, { activo: false, desde: "2026-01-01" }), // desactivado a mano: no se toca
    ],
  );
  const por = Object.fromEntries(plan.map((f) => [f.cod, f]));
  assert.deepEqual([por["000001"].estado, por["000001"].precioNuevo, por["000001"].sinPrecioDespues], ["sin_precio", 100, HOY]);
  assert.equal(por["000002"].estado, "desactivar");
  assert.equal(por["000003"].estado, "sin_precio");
  assert.equal(por["000005"].estado, "sin_precio");
  const desactivar = cambioAAplicar(por["000002"], undefined, { hoy: HOY });
  assert.deepEqual([desactivar.precioNuevo, desactivar.accionProducto, desactivar.sinPrecioDespues], [100, "desactivar", "2026-05-19"]);
  // Vuelve con precio: se reactiva, se pone el precio y se borra la fecha.
  assert.equal(por["000004"].estado, "reactivar");
  const vuelve = cambioAAplicar(por["000004"], undefined, { hoy: HOY });
  assert.deepEqual([vuelve.precioNuevo, vuelve.accionProducto, vuelve.sinPrecioDespues], [210, "reactivar", null]);
  // Una sola presentación sin precio no desactiva el artículo si otra sigue con precio.
  const conOtra = planDe([enLista("000006", 0), enLista("000007", 80)], [
    variante(6, "000006", 100, { producto_id: 50, desde: "2025-01-01" }), variante(7, "000007", 80, { producto_id: 50 }),
  ]);
  assert.equal(conOtra.find((f) => f.cod === "000006").estado, "sin_precio");
  assert.equal(restarMeses("2026-08-31", 6), "2026-02-28");
});

test("PRE-36: más del 20 % o un nombre que no se parece va a revisar; los extremos aparte; el primer precio no se revisa", () => {
  const plan = planDe(
    [
      enLista("000001", 125), enLista("000002", 79), enLista("000003", 105, "MARCOLAR Cacer.22 Prestig.-1429P"),
      enLista("000004", 201), enLista("000005", 49), enLista("000006", 300), enLista("000007", 120),
    ],
    [
      variante(1, "000001", 100), variante(2, "000002", 100), variante(3, "000003", 100, { nombre: "Vino Cuatro Monos Locos" }),
      variante(4, "000004", 100), variante(5, "000005", 100), variante(6, "000006", 0), variante(7, "000007", 100),
    ],
  );
  const por = Object.fromEntries(plan.map((f) => [f.cod, f]));
  assert.deepEqual([por["000001"].estado, por["000001"].motivos], ["revisar", ["variacion"]]);
  assert.equal(por["000002"].estado, "revisar");
  assert.deepEqual([por["000003"].estado, por["000003"].motivos], ["revisar", ["nombre"]]);
  assert.equal(por["000004"].estado, "extremo");
  assert.equal(por["000005"].estado, "extremo");
  assert.equal(por["000006"].estado, "primer_precio");
  assert.equal(por["000007"].estado, "sube"); // 20 % justo no pide revisión
  // Sin aprobar (o excluida) no se aplica; aprobada sí.
  assert.equal(cambioAAplicar(por["000001"], undefined, { hoy: HOY }), null);
  assert.equal(cambioAAplicar(por["000001"], "excluir", { hoy: HOY }), null);
  assert.equal(cambioAAplicar(por["000004"], "aprobar", { hoy: HOY }).precioNuevo, 201);
  // Las abreviaturas de la lista no cuentan como nombre distinto.
  assert.ok(similitudNombre("Car.Arcor Butt.Toff.Dulc.Leche x822g", "Caramelos Butter Toffees Dulce de Leche Arcor") >= 0.4);
});

test("PRE-37: el mismo código con precios distintos pide elegir; con precios iguales se toma una vez", () => {
  const plan = planDe(
    [
      enLista("006021", 20504.7, "MARCOLAR Cacer.22 Prestig.-1429P", 10), enLista("006021", 13951.61, "VINO CUATRO MONOS LOCOS 4*750cc", 20),
      enLista("000852", 897.24, "Esencia de Vainilla", 11), enLista("000852", 897.24, "Esencia de Vainilla", 30),
    ],
    [variante(1, "006021", 20504.7, { nombre: "Vino Cuatro Monos Locos" }), variante(2, "000852", 897.24)],
    [enLista("006021", 15000, "VINO CUATRO MONOS", 5)],
  );
  const repetido = plan.find((f) => f.cod === "006021");
  assert.equal(repetido.estado, "repetido");
  assert.deepEqual(repetido.opciones.map((o) => [o.precio, o.origen]), [[20504.7, "LISTA"], [13951.61, "LISTA"], [15000, "Datos Exportados"]]);
  assert.equal(plan.find((f) => f.cod === "000852").estado, "sin_cambio");
  assert.equal(cambioAAplicar(repetido, undefined, { hoy: HOY }), null);
  assert.equal(cambioAAplicar(repetido, "excluir", { hoy: HOY }), null);
  const elegida = cambioAAplicar(repetido, "opcion:1", { hoy: HOY });
  assert.deepEqual([elegida.precioAntes, elegida.precioNuevo], [20504.7, 13951.61]);
  assert.equal(cambioAAplicar(repetido, "opcion:9", { hoy: HOY }), null);
});
