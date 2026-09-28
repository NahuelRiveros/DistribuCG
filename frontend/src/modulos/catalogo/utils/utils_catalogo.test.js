import { describe, expect, it } from "vitest";
import { aplanarConNivel, armarArbol, idsDelSubarbol, rutaCategoria, totalConSubcategorias } from "./arbol.js";
import { precioVisible, presentacionMasBarata } from "./precios.js";

const categorias = [
  { id: 1, nombre: "Almacén", padre_id: null, cantidad_productos: 1 },
  { id: 2, nombre: "Galletitas", padre_id: 1, cantidad_productos: 3 },
  { id: 3, nombre: "Dulces", padre_id: 2, cantidad_productos: 2 },
  { id: 4, nombre: "Bebidas", padre_id: null, cantidad_productos: 5 },
];

describe("árbol de categorías", () => {
  it("arma el árbol y lo aplana con niveles", () => {
    const arbol = armarArbol(categorias);
    expect(arbol.map((n) => n.nombre)).toEqual(["Almacén", "Bebidas"]);
    expect(aplanarConNivel(categorias).map((c) => [c.nombre, c.nivel])).toEqual([
      ["Almacén", 0],
      ["Galletitas", 1],
      ["Dulces", 2],
      ["Bebidas", 0],
    ]);
    expect(totalConSubcategorias(arbol[0])).toBe(6);
  });

  it("calcula subárbol y ruta", () => {
    expect([...idsDelSubarbol(categorias, 1)].sort()).toEqual([1, 2, 3]);
    expect(rutaCategoria(categorias, 3)).toBe("Almacén › Galletitas › Dulces");
  });
});

describe("precios", () => {
  it("muestra el precio con IVA según la configuración", () => {
    expect(precioVisible("1000.00", "21.00")).toBe(1210);
    expect(precioVisible("999", 10.5)).toBe(1103.9);
  });

  it("elige la presentación activa más barata", () => {
    const producto = { variantes: [{ id: 1, precio: "50", activo: false }, { id: 2, precio: "80" }, { id: 3, precio: "120" }] };
    expect(presentacionMasBarata(producto).id).toBe(2);
  });
});
