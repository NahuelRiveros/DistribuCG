import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo, paginacionDe, productoEjemplo } from "@/test/datos_catalogo.js";
import ProductosPage from "./productos_page.jsx";

function simularApi() {
  const pedidos = [];
  let producto = productoEjemplo({ publicado: false });
  servidorMock.use(
    mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
    mock.get(`${API}/catalogo/productos`, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams);
      return HttpResponse.json({ ok: true, data: [producto], paginacion: paginacionDe([producto]) });
    }),
    mock.patch(`${API}/catalogo/productos/10/estado`, async ({ request }) => {
      const cuerpo = await request.json();
      producto = { ...producto, ...cuerpo };
      return HttpResponse.json({ ok: true, data: producto, cuerpo });
    }),
  );
  return pedidos;
}

describe("Admin · Productos", () => {
  it("lista productos con rango de precios con IVA y estado", async () => {
    simularApi();
    renderizar(<ProductosPage />);

    const fila = (await screen.findByText("Galletitas Oreo")).closest("tr");
    expect(within(fila).getByText("Galletitas")).toBeInTheDocument();
    expect(within(fila).getByText(/1\.210,00.*2\.420,00/)).toBeInTheDocument();
    expect(within(fila).getByText("Sin publicar")).toBeInTheDocument();
  });

  it("busca en el servidor cuando se deja de escribir", async () => {
    const pedidos = simularApi();
    renderizar(<ProductosPage />);
    await screen.findByText("Galletitas Oreo");

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar productos" }), "oreo");
    await waitFor(() => expect(pedidos.at(-1).get("q")).toBe("oreo"));
  });

  it("publica un producto desde la tabla", async () => {
    simularApi();
    renderizar(<ProductosPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Publicar Galletitas Oreo" }));
    expect(await screen.findByText("Producto publicado")).toBeInTheDocument();
    expect(await screen.findByText("Publicado")).toBeInTheDocument();
  });

  it("muestra un estado vacío útil", async () => {
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: [] })),
      mock.get(`${API}/catalogo/productos`, () => HttpResponse.json({ ok: true, data: [], paginacion: paginacionDe([]) })),
    );
    renderizar(<ProductosPage />);
    expect(await screen.findByText("Cargá tu primer producto para empezar.")).toBeInTheDocument();
  });
});
