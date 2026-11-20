import test from "node:test";
import assert from "node:assert/strict";
import { armarCsvRespaldo, indiceFotosRespaldo, urlOriginal, COLUMNAS_RESPALDO } from "../src/modulos/eccomerce_distribuidora/services/respaldo_catalogo_service.js";

const FOTO = "https://res.cloudinary.com/demo/image/upload/c_limit,f_auto,h_600,q_auto,w_600/v17/distribucg/productos/000100?_a=x";
const fila = (extra) => ({ codigo: "000100", articulo: "Aceite Natura", presentacion: "1,5 l", familia: "Almacén", categoria: "Aceites",
  marca: "Natura", precio: "3985.82", precio_anterior: null, iva: "21.00", unidad: "u", bulto: 12, unidad_bulto: "CAJA",
  codigo_barras: null, activo: true, descripcion: null, foto: FOTO, articulo_id: 7, ...extra });

test("CAT-65: la planilla del respaldo abre en Excel con coma decimal, sin fórmulas y dice qué está a la venta", () => {
  const csv = armarCsvRespaldo([fila(), fila({ codigo: "000101", presentacion: "900 ml", precio: "0.00" }), fila({ codigo: "000102", articulo: "=HYPERLINK(\"x\")", activo: false })]);
  assert.ok(csv.startsWith("\uFEFF"), "UTF-8 con BOM para los acentos");
  const [encabezado, uno, enCero, formula] = csv.slice(1).split("\r\n");
  assert.equal(encabezado.split(";").length, COLUMNAS_RESPALDO.length);
  assert.match(encabezado, /"Código";"Artículo"/);
  assert.match(uno, /^"000100";"Aceite Natura";"1,5 l";"Almacén";"Aceites";"Natura";"3985,82";"";"21";/);
  assert.match(uno, /;"sí";/);
  assert.match(enCero, /;"no";/, "en $0 no está a la venta");
  assert.match(formula, /"'=HYPERLINK\(""x""\)"/, "un texto con = no se ejecuta");
  assert.match(formula, /;"no";/, "oculto no está a la venta");
});

test("CAT-67: el índice de fotos agrupa por foto con el código más bajo y sirve para imagenes:subir", () => {
  const otra = "https://res.cloudinary.com/demo/image/upload/v2/distribucg/productos/000300";
  const indice = indiceFotosRespaldo([fila({ codigo: "000105" }), fila(), fila({ codigo: "000300", articulo: "Yerba", foto: otra }), fila({ codigo: "000400", foto: null }), fila({ codigo: null })]);
  assert.deepEqual(indice.map((f) => [f.archivo, f.codigos]), [["000100.jpg", ["000100", "000105"]], ["000300.jpg", ["000300"]]]);
  assert.equal(indice[0].categoria, "Almacén > Aceites");
  assert.equal(indice[0].imagen_origen, FOTO);
});

test("CAT-66: la foto se baja en su tamaño guardado: sin transformaciones de entrega", () => {
  assert.equal(urlOriginal(FOTO), "https://res.cloudinary.com/demo/image/upload/f_jpg/v17/distribucg/productos/000100");
  assert.equal(urlOriginal("https://res.cloudinary.com/demo/image/upload/c_limit,w_600/distribucg/x"), "https://res.cloudinary.com/demo/image/upload/f_jpg/distribucg/x");
  assert.equal(urlOriginal("https://otro.example/foto.jpg"), "https://otro.example/foto.jpg");
  assert.equal(urlOriginal("no es url"), "no es url");
});
