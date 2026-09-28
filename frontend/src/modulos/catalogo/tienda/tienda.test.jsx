import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { proyecto } from "compartido/proyecto.js";
import { conDescuento, mejorDescuento } from "compartido/reglas/pagos.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo, paginacionDe, productoEjemplo } from "@/test/datos_catalogo.js";
import CatalogoPage from "./catalogo_page.jsx";
import ProductoDetallePage from "./producto_detalle_page.jsx";

const sinEspacios = (t) => t.replace(/\s/g, " ");

describe("Tienda · Catálogo", () => {
  it("muestra las tarjetas con precio 'desde' con IVA y la oferta", async () => {
    const producto = productoEjemplo();
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
      mock.get(`${API}/catalogo/productos`, () => HttpResponse.json({ ok: true, data: [producto], paginacion: paginacionDe([producto]) })),
    );
    renderizar(<CatalogoPage />, { ruta: "/catalogo" });

    const tarjeta = await screen.findByRole("link", { name: /Galletitas Oreo/ });
    expect(tarjeta).toHaveAttribute("href", "/catalogo/galletitas-oreo");
    expect(within(tarjeta).getByText("Desde")).toBeInTheDocument();
    expect(within(tarjeta).getByText("$ 1.210,00", { normalizer: sinEspacios, exact: false })).toBeInTheDocument();
    expect(within(tarjeta).getByText("IVA incluido")).toBeInTheDocument();

    // Solo se listan categorías con productos (Almacén aparece porque su subcategoría tiene)
    const categorias = screen.getByRole("complementary", { name: "Categorías" });
    expect(within(categorias).getByRole("button", { name: "Almacén" })).toBeInTheDocument();
  });
});

describe("Tienda · Detalle de producto", () => {
  it("cambia el precio al elegir otra presentación", async () => {
    servidorMock.use(mock.get(`${API}/catalogo/productos/galletitas-oreo`, () => HttpResponse.json({ ok: true, data: productoEjemplo() })));
    renderizar(
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductoDetallePage />} />
      </Routes>,
      { ruta: "/catalogo/galletitas-oreo" },
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Galletitas Oreo" })).toBeInTheDocument();
    expect(sinEspacios(screen.getByTestId("precio").textContent)).toBe("$ 1.210,00");

    await userEvent.click(screen.getByRole("radio", { name: "Familiar 300 g" }));
    expect(sinEspacios(screen.getByTestId("precio").textContent)).toBe("$ 2.420,00");
    expect(screen.getByText("$ 3.025,00", { normalizer: sinEspacios })).toHaveClass("line-through");
    expect(screen.getByRole("link", { name: "Galletitas" })).toHaveAttribute("href", "/catalogo?categoria=2");
  });

  it("muestra medios de pago, cuotas y promociones calculados sobre el precio elegido, y el CBU al pedirlo", async () => {
    servidorMock.use(mock.get(`${API}/catalogo/productos/galletitas-oreo`, () => HttpResponse.json({ ok: true, data: productoEjemplo() })));
    renderizar(
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductoDetallePage />} />
      </Routes>,
      { ruta: "/catalogo/galletitas-oreo" },
    );

    const seccion = (await screen.findByRole("heading", { name: "Medios de pago y financiación" })).closest("section");
    expect(within(seccion).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Métodos de pago", "Financiación y cuotas", "Promociones bancarias"]);

    // El precio con el mejor descuento (ej. transferencia) se calcula sobre la presentación elegida y cambia con ella
    const descuento = mejorDescuento();
    if (descuento) {
      const pesos = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
      expect(sinEspacios(screen.getByTestId("precio-con-descuento").textContent)).toBe(sinEspacios(pesos(conDescuento(1210, descuento.descuento).total)));
      await userEvent.click(screen.getByRole("radio", { name: "Familiar 300 g" }));
      expect(sinEspacios(screen.getByTestId("precio-con-descuento").textContent)).toBe(sinEspacios(pesos(conDescuento(2420, descuento.descuento).total)));
    }

    // Los datos para transferir están a un click
    const datos = proyecto.pagos.datos_transferencia;
    if (datos?.cbu) {
      await userEvent.click(within(seccion).getByText("Ver CBU y alias"));
      expect(within(seccion).getByText(datos.cbu)).toBeVisible();
      expect(within(seccion).getByRole("button", { name: "Copiar CBU" })).toBeInTheDocument();
    }
  });

  it("avisa si el producto no existe", async () => {
    servidorMock.use(
      mock.get(`${API}/catalogo/productos/no-existe`, () =>
        HttpResponse.json({ ok: false, codigo: "PRODUCTO_NO_ENCONTRADO", mensaje: "El producto no existe o no está disponible.", detalles: [] }, { status: 404 }),
      ),
    );
    renderizar(
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductoDetallePage />} />
      </Routes>,
      { ruta: "/catalogo/no-existe" },
    );
    expect(await screen.findByText("El producto no existe o no está disponible.")).toBeInTheDocument();
  });
});

describe("Tienda · Disponibilidad", () => {
  const conStock = (disponibilidades) =>
    productoEjemplo({ variantes: productoEjemplo().variantes.map((v, i) => ({ ...v, disponibilidad: disponibilidades[i] })) });

  it("marca el producto agotado cuando ninguna presentación tiene stock", async () => {
    const agotado = conStock(["sin_stock", "sin_stock"]);
    servidorMock.use(
      mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo })),
      mock.get(`${API}/catalogo/productos`, () => HttpResponse.json({ ok: true, data: [agotado], paginacion: paginacionDe([agotado]) })),
    );
    renderizar(<CatalogoPage />, { ruta: "/catalogo" });
    const tarjeta = await screen.findByRole("link", { name: /Galletitas Oreo/ });
    expect(within(tarjeta).getByText("Sin stock")).toBeInTheDocument();
  });

  it("elige de entrada una presentación con stock y muestra el estado de la elegida", async () => {
    // La más barata (118 g) está sin stock: arranca en la Familiar
    servidorMock.use(mock.get(`${API}/catalogo/productos/galletitas-oreo`, () => HttpResponse.json({ ok: true, data: conStock(["sin_stock", "ultimas"]) })));
    renderizar(
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductoDetallePage />} />
      </Routes>,
      { ruta: "/catalogo/galletitas-oreo" },
    );

    expect(await screen.findByRole("radio", { name: "Familiar 300 g" })).toBeChecked();
    expect(screen.getByText("Últimas unidades")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /118 g.*sin stock/ }));
    // La etiqueta de disponibilidad y el botón de la tienda (deshabilitado) dicen "Sin stock"
    expect(screen.getAllByText("Sin stock")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
  });
});

describe("Tienda · Disponibilidad vista por un admin", () => {
  it("aunque el API mande la cantidad (panel), la tienda muestra el estado según la configuración", async () => {
    const conCantidad = productoEjemplo({
      variantes: [{ ...productoEjemplo().variantes[0], disponibilidad: "ultimas", cantidad_disponible: 5 }],
    });
    servidorMock.use(mock.get(`${API}/catalogo/productos/galletitas-oreo`, () => HttpResponse.json({ ok: true, data: conCantidad })));
    renderizar(
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductoDetallePage />} />
      </Routes>,
      { ruta: "/catalogo/galletitas-oreo" },
    );
    expect(await screen.findByText("Últimas unidades")).toBeInTheDocument();
    expect(screen.queryByText("Quedan 5")).not.toBeInTheDocument();
  });
});
