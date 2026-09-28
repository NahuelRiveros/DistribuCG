import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo } from "@/test/datos_catalogo.js";
import CategoriasPage from "./categorias_page.jsx";

describe("Admin · Categorías", () => {
  it("muestra el árbol con el total de productos incluyendo subcategorías", async () => {
    servidorMock.use(mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })));
    renderizar(<CategoriasPage />);

    const arbol = await screen.findByRole("list", { name: "Árbol de categorías" });
    const almacen = within(arbol).getByText("Almacén").closest("li");
    expect(within(almacen).getByText("Galletitas")).toBeInTheDocument();
    expect(within(almacen).getAllByText("1 producto")).toHaveLength(2); // Almacén suma la de Galletitas

    await userEvent.click(within(arbol).getByRole("button", { name: "Contraer Almacén" }));
    expect(within(arbol).queryByText("Galletitas")).not.toBeInTheDocument();
  });

  it("crea una subcategoría con el padre ya elegido", async () => {
    let enviado;
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
      mock.post(`${API}/catalogo/categorias`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ ok: true, data: { id: 9, ...enviado } }, { status: 201 });
      }),
    );
    renderizar(<CategoriasPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Nueva subcategoría en Bebidas" }));
    const dialogo = screen.getByRole("dialog", { name: "Nueva categoría" });
    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), "Aguas");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Categoría creada")).toBeInTheDocument();
    expect(enviado).toEqual({ nombre: "Aguas", padre_id: 3, orden: 0, en_menu: false });
  });

  it("explica por qué no se puede eliminar una categoría con productos", async () => {
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
      mock.delete(`${API}/catalogo/categorias/3`, () =>
        HttpResponse.json(
          { ok: false, codigo: "CATEGORIA_CON_PRODUCTOS", mensaje: "La categoría tiene 1 producto(s). Movelos o eliminalos antes.", detalles: [] },
          { status: 409 },
        ),
      ),
    );
    renderizar(<CategoriasPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Eliminar Bebidas" }));
    await userEvent.click(within(screen.getByRole("dialog", { name: "Eliminar categoría" })).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("La categoría tiene 1 producto(s). Movelos o eliminalos antes.")).toBeInTheDocument();
  });
});
