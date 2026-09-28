import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Tabla from "./tabla.jsx";

/** Simula el ancho de pantalla: matchMedia responde según `ancho` y avisa al cambiarlo. */
function pantalla(anchoInicial) {
  let ancho = anchoInicial;
  const oyentes = new Set();
  vi.stubGlobal("matchMedia", (consulta) => ({
    get matches() {
      return ancho <= Number(consulta.match(/max-width: (\d+)px/)[1]);
    },
    addEventListener: (_, fn) => oyentes.add(fn),
    removeEventListener: (_, fn) => oyentes.delete(fn),
  }));
  return (nuevo) => {
    ancho = nuevo;
    act(() => oyentes.forEach((fn) => fn()));
  };
}
afterEach(() => vi.unstubAllGlobals());

const FILAS = [
  { id: 1, nombre: "Yerba", precio: "$ 1.000", categoria: "Almacén" },
  { id: 2, nombre: "Azúcar", precio: "$ 800", categoria: "Almacén" },
];
const COLUMNAS = [
  { titulo: "Producto", principal: true, celda: (f) => f.nombre },
  { titulo: "Precio", derecha: true, celda: (f) => f.precio },
  { titulo: "Categoría", enTarjeta: false, celda: (f) => f.categoria },
];
const acciones = (f, { enTarjeta }) => <button type="button">{enTarjeta ? `Editar ${f.nombre}` : "✎"}</button>;

describe("Tabla", () => {
  it("en pantallas anchas es una tabla con encabezados y columna de acciones", () => {
    pantalla(1280);
    render(<Tabla etiqueta="Productos" filas={FILAS} columnas={COLUMNAS} acciones={acciones} />);

    const tabla = screen.getByRole("table", { name: "Productos" });
    expect(within(tabla).getAllByRole("columnheader").map((c) => c.textContent)).toEqual(["Producto", "Precio", "Categoría", "Acciones"]);
    expect(within(tabla).getAllByRole("row")).toHaveLength(3);
    expect(within(tabla).getAllByRole("button", { name: "✎" })).toHaveLength(2);
  });

  it("en celular es una tarjeta por fila: el dato principal arriba, el resto rotulado y sin lo secundario", () => {
    pantalla(400);
    render(<Tabla etiqueta="Productos" filas={FILAS} columnas={COLUMNAS} acciones={acciones} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const [yerba] = within(screen.getByRole("list", { name: "Productos" })).getAllByRole("listitem");
    expect(within(yerba).getByText("Yerba")).toBeInTheDocument();
    expect(within(yerba).getByText("Precio")).toBeInTheDocument(); // rótulo
    expect(within(yerba).queryByText("Almacén")).not.toBeInTheDocument(); // enTarjeta: false
    expect(within(yerba).getByRole("button", { name: "Editar Yerba" })).toBeInTheDocument(); // acciones con texto
  });

  it("cambia sola al girar el celular o agrandar la ventana", () => {
    const cambiarAncho = pantalla(400);
    render(<Tabla etiqueta="Productos" filas={FILAS} columnas={COLUMNAS} />);
    expect(screen.getByRole("list", { name: "Productos" })).toBeInTheDocument();

    cambiarAncho(1280);
    expect(screen.getByRole("table", { name: "Productos" })).toBeInTheDocument();
  });

  it("con tarjetasHasta='md' (sin menú lateral) una tablet ya ve la tabla", () => {
    pantalla(900);
    render(<Tabla etiqueta="Productos" filas={FILAS} columnas={COLUMNAS} tarjetasHasta="md" />);
    expect(screen.getByRole("table", { name: "Productos" })).toBeInTheDocument();
  });
});
