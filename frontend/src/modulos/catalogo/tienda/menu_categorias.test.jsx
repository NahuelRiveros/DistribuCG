import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { nombreProductos } from "@/clientes/index.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import MenuCategorias from "./menu_categorias.jsx";

const cat = (id, nombre, extra = {}) => ({ id, nombre, slug: nombre.toLowerCase(), padre_id: null, orden: id, en_menu: false, cantidad_productos: 1, ...extra });
const ROPA = [
  cat(1, "Mujer", { en_menu: true, cantidad_productos: 0 }),
  cat(2, "Remeras", { padre_id: 1, cantidad_productos: 5 }),
  cat(3, "Vestidos", { padre_id: 1, cantidad_productos: 0 }), // vacía: no se ofrece
  cat(4, "Hombre", { en_menu: true }),
  cat(5, "Calzado", { en_menu: true }),
  cat(6, "Liquidación", { en_menu: false }),
];
const categorias = (lista) => servidorMock.use(mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: lista })));

describe("Menú por categorías · escritorio", () => {
  it("muestra las categorías marcadas; las que tienen subcategorías se despliegan (sin las vacías)", async () => {
    categorias(ROPA);
    renderizar(<MenuCategorias variante="escritorio" />);

    const mujer = await screen.findByRole("button", { name: "Mujer" });
    expect(screen.getByRole("link", { name: "Hombre" })).toHaveAttribute("href", "/catalogo?categoria=4");
    expect(screen.queryByText("Liquidación")).not.toBeInTheDocument();

    await userEvent.click(mujer);
    expect(mujer).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Remeras" })).toHaveAttribute("href", "/catalogo?categoria=2");
    expect(screen.queryByRole("link", { name: "Vestidos" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todo Mujer" })).toHaveAttribute("href", "/catalogo?categoria=1");

    await userEvent.keyboard("{Escape}");
    expect(mujer).toHaveAttribute("aria-expanded", "false");
    expect(mujer).toHaveFocus();
  });

  it("con muchas categorías, las que no entran van en 'Más'", async () => {
    categorias(Array.from({ length: 8 }, (_, i) => cat(i + 1, `Cat ${i + 1}`, { en_menu: true })));
    renderizar(<MenuCategorias variante="escritorio" />);

    expect(await screen.findByRole("link", { name: "Cat 6" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cat 7" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Más" }));
    expect(screen.getByRole("link", { name: "Cat 7" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cat 8" })).toBeInTheDocument();
  });

  it("si todavía no hay categorías marcadas, muestra el link de productos", async () => {
    categorias([cat(1, "Almacén")]);
    renderizar(<MenuCategorias variante="escritorio" />);
    expect(await screen.findByRole("link", { name: nombreProductos })).toHaveAttribute("href", "/catalogo");
  });
});

describe("Menú por categorías · celular", () => {
  it("cada categoría es un grupo que se abre, y elegir una cierra el menú", async () => {
    categorias(ROPA);
    const onNavegar = vi.fn();
    renderizar(<MenuCategorias variante="celular" onNavegar={onNavegar} />);

    const mujer = await screen.findByRole("button", { name: "Mujer" });
    expect(screen.queryByRole("link", { name: "Remeras" })).not.toBeInTheDocument();
    await userEvent.click(mujer);
    const grupo = document.getElementById(mujer.getAttribute("aria-controls"));
    expect(within(grupo).getAllByRole("link").map((l) => l.textContent)).toEqual(["Ver todo Mujer", "Remeras"]);

    await userEvent.click(within(grupo).getByRole("link", { name: "Remeras" }));
    expect(onNavegar).toHaveBeenCalled();
  });
});
