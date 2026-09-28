import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo, productoEjemplo } from "@/test/datos_catalogo.js";
import ProductoFormPage from "./producto_form_page.jsx";

function renderizarFormulario(ruta) {
  return renderizar(
    <Routes>
      <Route path="/admin/catalogo/productos" element={<p>Listado de productos</p>} />
      <Route path="/admin/catalogo/productos/nuevo" element={<ProductoFormPage />} />
      <Route path="/admin/catalogo/productos/:id" element={<ProductoFormPage />} />
    </Routes>,
    { ruta },
  );
}

const categorias = () => mock.get(`${API}/catalogo/categorias`, () => HttpResponse.json({ ok: true, data: categoriasEjemplo }));

describe("Admin · Formulario de producto", () => {
  it("valida antes de enviar", async () => {
    servidorMock.use(categorias());
    renderizarFormulario("/admin/catalogo/productos/nuevo");

    await userEvent.click(await screen.findByRole("button", { name: "Guardar producto" }));
    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("Elegí una categoría", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("El precio es obligatorio")).toBeInTheDocument();
  });

  it("crea un producto con dos presentaciones y precio con coma decimal", async () => {
    let enviado;
    servidorMock.use(
      categorias(),
      mock.post(`${API}/catalogo/productos`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ ok: true, data: productoEjemplo() }, { status: 201 });
      }),
      mock.get(`${API}/catalogo/productos/10`, () => HttpResponse.json({ ok: true, data: productoEjemplo() })),
    );
    renderizarFormulario("/admin/catalogo/productos/nuevo");

    const datos = (await screen.findByRole("heading", { name: "Datos del producto" })).closest("section");
    await userEvent.type(within(datos).getByLabelText(/^Nombre/), "Yerba Playadito");
    await userEvent.selectOptions(within(datos).getByLabelText(/^Categoría/), "3");

    const primera = screen.getByRole("listitem", { name: "Presentación 1" });
    await userEvent.type(within(primera).getByLabelText(/^Nombre/), "500 g");
    await userEvent.type(within(primera).getByLabelText(/^Precio neto/), "1000,5");
    expect(within(primera).getByText("$ 1.210,61", { normalizer: (t) => t.replace(/\s/g, " ") })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Agregar presentación" }));
    const segunda = screen.getByRole("listitem", { name: "Presentación 2" });
    await userEvent.type(within(segunda).getByLabelText(/^Nombre/), "1 kg");
    await userEvent.type(within(segunda).getByLabelText(/^Precio neto/), "1900");
    await userEvent.selectOptions(within(segunda).getByLabelText(/^IVA/), "10.5");

    await userEvent.click(screen.getByRole("button", { name: "Guardar producto" }));

    // Se queda en la edición del producto creado, con la galería de imágenes disponible
    expect(await screen.findByRole("heading", { name: "Editar Galletitas Oreo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Imágenes" })).toBeInTheDocument();
    expect(enviado).toMatchObject({
      categoria_id: 3,
      nombre: "Yerba Playadito",
      variantes: [
        { nombre: "500 g", precio: 1000.5, iva_porcentaje: 21 },
        { nombre: "1 kg", precio: 1900, iva_porcentaje: 10.5 },
      ],
    });
  });

  it("edita un producto existente y muestra el error del servidor en el campo", async () => {
    servidorMock.use(
      categorias(),
      mock.get(`${API}/catalogo/productos/10`, () => HttpResponse.json({ ok: true, data: productoEjemplo() })),
      mock.put(`${API}/catalogo/productos/10`, () =>
        HttpResponse.json(
          { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Revisá los datos ingresados.", detalles: [{ campo: "variantes.1.sku", mensaje: "Código repetido en este producto" }] },
          { status: 400 },
        ),
      ),
    );
    renderizarFormulario("/admin/catalogo/productos/10");

    const segunda = await screen.findByRole("listitem", { name: "Presentación 2" });
    expect(within(segunda).getByLabelText(/^Código/)).toHaveValue("ORE-300");

    await userEvent.click(screen.getByRole("button", { name: "Guardar producto" }));
    expect(await within(segunda).findByText("Código repetido en este producto")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Revisá los campos marcados.");
  });

  it("no deja quitar la única presentación", async () => {
    servidorMock.use(categorias());
    renderizarFormulario("/admin/catalogo/productos/nuevo");
    expect(await screen.findByRole("button", { name: "Quitar presentación 1" })).toBeDisabled();
  });
});
