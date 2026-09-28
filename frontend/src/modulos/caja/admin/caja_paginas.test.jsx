import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import BalancePage from "./balance_page.jsx";
import CalendarioPage from "./calendario_page.jsx";
import CategoriasPage from "./categorias_page.jsx";

const sinEspacios = (t) => t.replace(/\s/g, " ");
const CATEGORIAS = [
  { id: 1, tipo: "ingreso", nombre: "Venta en local", activa: true, orden: 1, movimientos: 0 },
  { id: 3, tipo: "egreso", nombre: "Mercadería", activa: true, orden: 1, movimientos: 0 },
  { id: 4, tipo: "egreso", nombre: "Sueldos", activa: true, orden: 2, movimientos: 2 },
  { id: 5, tipo: "egreso", nombre: "Alquiler", activa: false, orden: 3, movimientos: 0 },
];
const mesVacio = (extra = {}) => ({
  anio: 2026,
  mes: 9,
  hoy: "2026-09-28",
  dias: Array.from({ length: 30 }, (_, i) => ({ fecha: `2026-09-${String(i + 1).padStart(2, "0")}`, ingresos: 0, egresos: 0, saldo: 0, cantidad: 0 })),
  totales: { ingresos: 0, egresos: 0, saldo: 0 },
  ...extra,
});

beforeEach(() => {
  localStorage.setItem(CLAVE_SESION, "token");
  servidorMock.use(
    mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 1, nombre: "Ana", email: "a@a.com", roles: ["admin"] } })),
    mock.get(`${API}/caja/categorias`, () => HttpResponse.json({ ok: true, data: CATEGORIAS })),
  );
});

describe("Caja · Balance anual", () => {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, ingresos: 0, egresos: 0, saldo: 0 }));
  meses[2] = { mes: 3, ingresos: 150000, egresos: 200000, saldo: -50000 };

  it("muestra totales, el gráfico por mes, la tabla y el reparto por categoría", async () => {
    servidorMock.use(
      mock.get(`${API}/caja/anual`, () =>
        HttpResponse.json({
          ok: true,
          data: {
            anio: 2026,
            anios: [2026, 2025],
            meses,
            totales: { ingresos: 150000, egresos: 200000, saldo: -50000 },
            por_categoria: [
              { tipo: "egreso", categoria_id: 4, categoria: "Sueldos", origen: "manual", total: 200000 },
              { tipo: "ingreso", categoria_id: null, categoria: "Ventas de la tienda", origen: "tienda", total: 150000 },
            ],
          },
        }),
      ),
    );
    renderizar(<BalancePage />, { ruta: "/admin/caja" });

    expect(sinEspacios((await screen.findByTestId("total-saldo 2026")).textContent)).toBe("− $ 50.000,00");
    const marzo = screen.getByRole("link", { name: /^Marzo: ingresos/ });
    expect(marzo).toHaveAttribute("href", "/admin/caja/calendario?anio=2026&mes=3");
    await userEvent.hover(marzo);
    expect(within(screen.getByRole("tooltip")).getByText("Marzo 2026")).toBeInTheDocument();

    const fila = screen.getByRole("link", { name: "Marzo" }).closest("tr");
    expect(sinEspacios(fila.textContent)).toContain("− $ 50.000,00");
    expect(screen.getByText("Ventas de la tienda")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2025" })).toBeInTheDocument();
  });
});

describe("Caja · Calendario", () => {
  it("al elegir un día muestra sus movimientos: los de la tienda se ven pero no se editan", async () => {
    const dias = mesVacio().dias;
    dias[9] = { fecha: "2026-09-10", ingresos: 2500, egresos: 1000, saldo: 1500, cantidad: 2 };
    servidorMock.use(
      mock.get(`${API}/caja/mes`, () => HttpResponse.json({ ok: true, data: mesVacio({ dias, totales: { ingresos: 2500, egresos: 1000, saldo: 1500 } }) })),
      mock.get(`${API}/caja/movimientos`, () =>
        HttpResponse.json({
          ok: true,
          data: [
            { origen: "manual", id: "7", tipo: "egreso", fecha: "2026-09-10", monto: 1000, categoria_id: 4, categoria: "Sueldos", medio: "efectivo", descripcion: "Adelanto", anulado: false, registrado_por: "Ana" },
            { origen: "tienda", id: "p3", tipo: "ingreso", fecha: "2026-09-10", monto: 2500, categoria_id: null, categoria: "Ventas de la tienda", medio: "transferencia", descripcion: "Pedido #3", anulado: false, pedido_id: 3, registrado_por: "Ana" },
          ],
          paginacion: { pagina: 1, limite: 100, total: 2, total_paginas: 1 },
        }),
      ),
    );
    renderizar(<CalendarioPage />, { ruta: "/admin/caja/calendario?anio=2026&mes=9" });

    expect(await screen.findByRole("heading", { name: "Septiembre 2026" })).toBeInTheDocument();
    // En jsdom se ven las dos vistas (grilla y lista de celular); se usa la primera
    await userEvent.click((await screen.findAllByRole("button", { name: /^Jueves 10 de septiembre: ingresos/ }))[0]);

    const lista = await screen.findByRole("list", { name: "Movimientos del Jueves 10 de septiembre" });
    const [sueldo, venta] = within(lista).getAllByRole("listitem");
    expect(within(sueldo).getByRole("button", { name: /^Editar Sueldos/ })).toBeInTheDocument();
    expect(within(venta).queryByRole("button")).not.toBeInTheDocument();
    expect(within(venta).getByRole("link", { name: "Ver pedido" })).toHaveAttribute("href", "/admin/pedidos/3");
  });

  it("registrar: solo ofrece categorías activas del tipo elegido y envía el movimiento", async () => {
    const enviados = [];
    servidorMock.use(
      mock.get(`${API}/caja/mes`, () => HttpResponse.json({ ok: true, data: mesVacio() })),
      mock.get(`${API}/caja/movimientos`, () => HttpResponse.json({ ok: true, data: [], paginacion: { pagina: 1, limite: 100, total: 0, total_paginas: 0 } })),
      mock.post(`${API}/caja/movimientos`, async ({ request }) => {
        enviados.push(await request.json());
        return HttpResponse.json({ ok: true, data: { id: 9 } }, { status: 201 });
      }),
    );
    renderizar(<CalendarioPage />, { ruta: "/admin/caja/calendario?anio=2026&mes=9&dia=2026-09-15" });

    await userEvent.click(await screen.findByRole("button", { name: "Registrar ingreso o egreso" }));
    const dialogo = screen.getByRole("dialog", { name: "Registrar movimiento" });
    const categoria = within(dialogo).getByLabelText(/^Categoría/);
    // Egreso por defecto: la desactivada ("Alquiler") no aparece
    expect(within(categoria).getAllByRole("option").map((o) => o.textContent)).toEqual(["Elegí una categoría", "Mercadería", "Sueldos"]);

    await userEvent.click(within(dialogo).getByText("Ingreso"));
    expect(within(categoria).getAllByRole("option").map((o) => o.textContent)).toEqual(["Elegí una categoría", "Venta en local"]);

    await userEvent.click(within(dialogo).getByRole("button", { name: "Registrar" }));
    expect(await within(dialogo).findByText("El monto es obligatorio")).toBeInTheDocument();
    expect(categoria).toHaveAttribute("aria-invalid", "true"); // "Elegí una categoría"

    await userEvent.type(within(dialogo).getByLabelText(/^Monto/), "1500,50");
    await userEvent.selectOptions(categoria, "Venta en local");
    await userEvent.selectOptions(within(dialogo).getByLabelText(/^Medio de pago/), "efectivo");
    await userEvent.type(within(dialogo).getByLabelText(/^Descripción/), "Venta mostrador");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(enviados).toEqual([{ tipo: "ingreso", fecha: "2026-09-15", monto: 1500.5, categoria_id: 1, medio: "efectivo", descripcion: "Venta mostrador" }]),
    );
    expect(await screen.findByText("Movimiento registrado")).toBeInTheDocument();
  });

  it("anular pide el motivo", async () => {
    let anulacion;
    servidorMock.use(
      mock.get(`${API}/caja/mes`, () => HttpResponse.json({ ok: true, data: mesVacio() })),
      mock.get(`${API}/caja/movimientos`, () =>
        HttpResponse.json({
          ok: true,
          data: [{ origen: "manual", id: "7", tipo: "egreso", fecha: "2026-09-10", monto: 1000, categoria_id: 4, categoria: "Sueldos", medio: "efectivo", descripcion: null, anulado: false, registrado_por: "Ana" }],
          paginacion: { pagina: 1, limite: 100, total: 1, total_paginas: 1 },
        }),
      ),
      mock.post(`${API}/caja/movimientos/7/anular`, async ({ request }) => {
        anulacion = await request.json();
        return HttpResponse.json({ ok: true, data: {} });
      }),
    );
    renderizar(<CalendarioPage />, { ruta: "/admin/caja/calendario?anio=2026&mes=9&dia=2026-09-10" });

    await userEvent.click(await screen.findByRole("button", { name: /^Anular Sueldos/ }));
    const dialogo = screen.getByRole("dialog", { name: "Anular movimiento" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Anular" }));
    expect(await within(dialogo).findByText("El motivo es obligatorio")).toBeInTheDocument();

    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "Cargado dos veces");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Anular" }));
    await waitFor(() => expect(anulacion).toEqual({ motivo: "Cargado dos veces" }));
  });
});

describe("Caja · Categorías", () => {
  it("lista los tipos de ingreso y egreso y permite agregar uno nuevo", async () => {
    let creada;
    servidorMock.use(
      mock.post(`${API}/caja/categorias`, async ({ request }) => {
        creada = await request.json();
        return HttpResponse.json({ ok: true, data: { id: 9, ...creada, activa: true, movimientos: 0 } }, { status: 201 });
      }),
    );
    renderizar(<CategoriasPage />, { ruta: "/admin/caja/categorias" });

    const egresos = (await screen.findByRole("heading", { name: "Egresos" })).closest("section");
    expect(within(egresos).getByText("Desactivada")).toBeInTheDocument();
    expect(within(egresos).getByText("2 movimientos")).toBeInTheDocument();

    await userEvent.click(within(egresos).getByRole("button", { name: "Nueva categoría de egresos" }));
    const dialogo = screen.getByRole("dialog", { name: "Nueva categoría de egresos" });
    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), "Publicidad");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(creada).toEqual({ tipo: "egreso", nombre: "Publicidad" }));
  });
});
