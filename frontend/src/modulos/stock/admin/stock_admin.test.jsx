import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo, paginacionDe } from "@/test/datos_catalogo.js";
import ExistenciasPage from "./existencias_page.jsx";
import IngresoPage from "./ingreso_page.jsx";
import HistorialPage from "./historial_page.jsx";

const existencia = (extra = {}) => ({
  variante_id: 100,
  producto_id: 10,
  producto: "Yerba",
  presentacion: "500 g",
  sku: "YER-500",
  categoria: "Almacén",
  controla_stock: true,
  cantidad: 10,
  reservado: 2,
  disponible: 8,
  minimo: 3,
  estado: "ok",
  ...extra,
});
const lista = [existencia(), existencia({ variante_id: 101, producto: "Azúcar", presentacion: null, sku: "AZU", controla_stock: false, cantidad: 0, reservado: 0, disponible: 0, minimo: 0, estado: "sin_control" })];

describe("Stock · Existencias", () => {
  it("muestra cantidades y estado, y solo deja ajustar lo que controla stock", async () => {
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
      mock.get(`${API}/stock/existencias`, () => HttpResponse.json({ ok: true, data: lista, paginacion: paginacionDe(lista) })),
    );
    renderizar(<ExistenciasPage />);

    const yerba = (await screen.findByText("Yerba · 500 g")).closest("tr");
    expect(within(yerba).getAllByRole("cell").slice(2, 7).map((c) => c.textContent)).toEqual(["10", "2", "8", "3", "OK"]);
    expect(within(yerba).getByRole("button", { name: "Ajustar stock de Yerba · 500 g" })).toBeInTheDocument();

    const azucar = screen.getByText("Azúcar").closest("tr");
    expect(within(azucar).getByText("Sin control")).toBeInTheDocument();
    expect(within(azucar).queryByRole("button", { name: /Ajustar/ })).not.toBeInTheDocument();
  });

  it("ajusta por conteo mostrando cuánto queda", async () => {
    let enviado;
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: [] })),
      mock.get(`${API}/stock/existencias`, () => HttpResponse.json({ ok: true, data: lista, paginacion: paginacionDe(lista) })),
      mock.post(`${API}/stock/ajustes`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ ok: true, data: { diferencia: -3, saldo_cantidad: 7 } }, { status: 201 });
      }),
    );
    renderizar(<ExistenciasPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Ajustar stock de Yerba · 500 g" }));
    const dialogo = screen.getByRole("dialog");
    await userEvent.type(within(dialogo).getByLabelText("Cantidad contada"), "7");
    expect(within(dialogo).getByText("Queda: 7")).toBeInTheDocument();
    await userEvent.click(within(dialogo).getByRole("button", { name: "Registrar ajuste" }));

    expect(await screen.findByText("Stock ajustado: quedan 7")).toBeInTheDocument();
    expect(enviado).toEqual({ variante_id: 100, modo: "fijar", cantidad: 7, motivo: "Conteo de inventario" });
  });

  it("avisa si un ajuste dejaría menos que lo reservado", async () => {
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: [] })),
      mock.get(`${API}/stock/existencias`, () => HttpResponse.json({ ok: true, data: lista, paginacion: paginacionDe(lista) })),
    );
    renderizar(<ExistenciasPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Ajustar stock de Yerba · 500 g" }));
    const dialogo = screen.getByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("radio", { name: "Restar" }));
    await userEvent.type(within(dialogo).getByLabelText("Cantidad"), "9");
    expect(within(dialogo).getByText("No puede quedar menos que lo reservado para pedidos")).toBeInTheDocument();
  });
});

describe("Stock · Ingreso de mercadería", () => {
  it("busca, agrega productos y registra el ingreso con remito", async () => {
    let enviado;
    servidorMock.use(
      mock.get(`${API}/stock/existencias`, () => HttpResponse.json({ ok: true, data: lista, paginacion: paginacionDe(lista) })),
      mock.post(`${API}/stock/ingresos`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ ok: true, data: { movimientos: 2, unidades: 30 } }, { status: 201 });
      }),
    );
    renderizar(<IngresoPage />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar producto para agregar" }), "ye");
    await userEvent.click(await screen.findByRole("button", { name: /Yerba \(500 g\)/ }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar producto para agregar" }), "az");
    await userEvent.click(await screen.findByRole("button", { name: /Azúcar/ }));

    const productos = screen.getByRole("list", { name: "Productos del ingreso" });
    const [primera, segunda] = within(productos).getAllByRole("listitem");
    await userEvent.type(within(primera).getByLabelText("Cantidad"), "24");
    await userEvent.type(within(primera).getByLabelText("Costo unitario"), "650,5");
    await userEvent.type(within(segunda).getByLabelText("Cantidad"), "6");
    await userEvent.type(screen.getByLabelText("Remito o factura"), "R-0001-123");
    await userEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));

    expect(await screen.findByText("Ingreso registrado: 30 unidades en 2 presentación(es)")).toBeInTheDocument();
    expect(enviado).toEqual({
      items: [
        { variante_id: 100, cantidad: 24, costo_unitario: 650.5 },
        { variante_id: 101, cantidad: 6, costo_unitario: null },
      ],
      referencia: "R-0001-123",
      motivo: null,
    });
    await waitFor(() => expect(screen.queryByRole("list", { name: "Productos del ingreso" })).not.toBeInTheDocument());
  });

  it("marca la fila con error antes de enviar", async () => {
    servidorMock.use(mock.get(`${API}/stock/existencias`, () => HttpResponse.json({ ok: true, data: lista, paginacion: paginacionDe(lista) })));
    renderizar(<IngresoPage />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar producto para agregar" }), "ye");
    await userEvent.click(await screen.findByRole("button", { name: /Yerba \(500 g\)/ }));
    await userEvent.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    expect(screen.getByRole("alert")).toHaveTextContent("La cantidad es obligatoria (fila 1)");
  });
});

describe("Stock · Historial", () => {
  it("muestra el saldo actual y los movimientos con su detalle", async () => {
    servidorMock.use(
      mock.get(`${API}/stock/variantes/100/movimientos`, () =>
        HttpResponse.json({
          ok: true,
          existencia: existencia(),
          data: [
            { id: 2, tipo: "ajuste", cantidad: -2, reservado: 0, saldo_cantidad: 10, motivo: "Rotura", referencia_tipo: null, referencia_id: null, costo_unitario: null, creado_en: "2026-09-25T15:00:00Z", usuario: { nombre: "Ana", apellido: "Gómez" } },
            { id: 1, tipo: "ingreso", cantidad: 12, reservado: 0, saldo_cantidad: 12, motivo: null, referencia_tipo: "remito", referencia_id: "R-1", costo_unitario: "650.50", creado_en: "2026-09-25T14:00:00Z", usuario: null },
          ],
          paginacion: paginacionDe([1, 2]),
        }),
      ),
    );
    renderizar(
      <Routes>
        <Route path="/admin/stock/:id" element={<HistorialPage />} />
      </Routes>,
      { ruta: "/admin/stock/100" },
    );

    expect(await screen.findByRole("heading", { name: "Yerba (500 g)" })).toBeInTheDocument();
    const [ajuste, ingreso] = screen.getAllByRole("row").slice(1);
    expect(within(ajuste).getByText("−2")).toBeInTheDocument();
    expect(within(ajuste).getByText("Ana Gómez")).toBeInTheDocument();
    expect(within(ingreso).getByText(/remito R-1 · costo \$\s650,50/)).toBeInTheDocument();
    expect(within(ingreso).getByText("Sistema")).toBeInTheDocument();
  });
});
