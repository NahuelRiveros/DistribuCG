import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import { categoriasEjemplo, productoEjemplo } from "@/test/datos_catalogo.js";
import AjustePreciosModal from "./ajuste_precios_modal.jsx";
import ImagenesProducto from "./imagenes_producto.jsx";

const sinEspacios = (t) => t.replace(/\s/g, " ");

describe("Admin · Ajuste masivo de precios", () => {
  function simular() {
    const cuerpos = [];
    servidorMock.use(
      mock.post(`${API}/catalogo/precios/ajuste`, async ({ request }) => {
        const cuerpo = await request.json();
        cuerpos.push(cuerpo);
        return HttpResponse.json({
          ok: true,
          data: cuerpo.simular
            ? { cantidad: 2, aplicado: false, ejemplos: [{ producto: "Oreo", presentacion: "118 g", antes: "1000.00", despues: "1100.00", iva_porcentaje: "21.00" }] }
            : { cantidad: 2, aplicado: true, ejemplos: [] },
        });
      }),
    );
    return cuerpos;
  }

  it("muestra la vista previa con precios en tienda y después aplica", async () => {
    const cuerpos = simular();
    const onCerrar = vi.fn();
    renderizar(<AjustePreciosModal categorias={categoriasEjemplo} onCerrar={onCerrar} />);

    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "1");
    await userEvent.type(screen.getByLabelText("Porcentaje"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));

    expect(await screen.findByText("Se van a actualizar 2 presentación(es).")).toBeInTheDocument();
    expect(screen.getByText("$ 1.331,00", { normalizer: sinEspacios })).toBeInTheDocument(); // 1100 + IVA
    expect(cuerpos[0]).toMatchObject({ porcentaje: 10, categoria_id: 1, simular: true });

    await userEvent.click(screen.getByRole("button", { name: "Aplicar a 2" }));
    await waitFor(() => expect(onCerrar).toHaveBeenCalled());
    expect(cuerpos[1]).toMatchObject({ simular: false, categoria_id: 1 });
  });

  it("si cambia el porcentaje hay que volver a ver la vista previa", async () => {
    simular();
    renderizar(<AjustePreciosModal categorias={categoriasEjemplo} onCerrar={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "1");
    await userEvent.type(screen.getByLabelText("Porcentaje"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    await screen.findByRole("button", { name: "Aplicar a 2" });

    await userEvent.type(screen.getByLabelText("Porcentaje"), "0");
    expect(screen.queryByRole("button", { name: "Aplicar a 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver vista previa" })).toBeInTheDocument();
  });

  it("todo el catálogo pide confirmación explícita", async () => {
    const cuerpos = simular();
    renderizar(<AjustePreciosModal categorias={categoriasEjemplo} onCerrar={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Todo el catálogo" }));
    await userEvent.type(screen.getByLabelText("Porcentaje"), "-5");
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    await userEvent.click(await screen.findByRole("button", { name: "Aplicar a 2" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Tildá la confirmación");
    expect(cuerpos).toHaveLength(1); // no se aplicó
  });

  it("valida antes de llamar al servidor", async () => {
    const cuerpos = simular();
    renderizar(<AjustePreciosModal categorias={categoriasEjemplo} onCerrar={() => {}} />);
    await userEvent.type(screen.getByLabelText("Porcentaje"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Elegí una categoría o confirmá aplicar a todo el catálogo");
    expect(cuerpos).toHaveLength(0);
  });
});

describe("Admin · Imágenes del producto", () => {
  const conImagenes = productoEjemplo({
    imagenes: [
      { id: 1, url: "https://cdn.test/a.webp", alt: "A", orden: 0 },
      { id: 2, url: "https://cdn.test/b.webp", alt: "B", orden: 1 },
    ],
  });

  it("marca la principal y reordena", async () => {
    let orden;
    servidorMock.use(
      mock.put(`${API}/catalogo/productos/10/imagenes/orden`, async ({ request }) => {
        orden = (await request.json()).ids;
        return HttpResponse.json({ ok: true, data: [] });
      }),
    );
    renderizar(<ImagenesProducto producto={conImagenes} />);

    const lista = screen.getByRole("list", { name: "Imágenes del producto" });
    expect(within(lista).getByText("Principal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mover imagen 1 antes" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Mover imagen 2 antes" }));
    await waitFor(() => expect(orden).toEqual([2, 1]));
  });

  it("sube archivos elegidos y explica si el servicio no está configurado", async () => {
    const subidas = [];
    servidorMock.use(
      // El multipart real se prueba en el servidor (supertest); jsdom no lo arma igual que un navegador.
      mock.post(`${API}/catalogo/productos/10/imagenes`, () => {
        subidas.push("llamada");
        return HttpResponse.json(
          { ok: false, codigo: "IMAGENES_NO_CONFIGURADAS", mensaje: "La subida de imágenes todavía no está configurada.", detalles: [] },
          { status: 503 },
        );
      }),
    );
    renderizar(<ImagenesProducto producto={conImagenes} />);

    await userEvent.upload(screen.getByLabelText("Elegir imágenes"), new File(["x"], "foto.png", { type: "image/png" }));
    expect(await screen.findByText("La subida de imágenes todavía no está configurada.")).toBeInTheDocument();
    expect(subidas).toEqual(["llamada"]);
  });

  it("agrega una imagen pegando su dirección", async () => {
    let cuerpo;
    servidorMock.use(
      mock.post(`${API}/catalogo/productos/10/imagenes/url`, async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json({ ok: true, data: { id: 3 } }, { status: 201 });
      }),
    );
    renderizar(<ImagenesProducto producto={conImagenes} />);

    await userEvent.type(screen.getByLabelText("O pegá la dirección de una imagen"), "https://web.com/c.jpg");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    await waitFor(() => expect(cuerpo).toEqual({ url: "https://web.com/c.jpg" }));
  });
});
