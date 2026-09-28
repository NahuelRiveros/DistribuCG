import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import ImportacionPage from "./importacion_page.jsx";

const BASE = `${API}/catalogo/importacion`;
const vista = {
  columnas: [
    { clave: "c1", nombre: "Código", etiqueta: "Código · columna 1" },
    { clave: "c2", nombre: "Producto", etiqueta: "Producto · columna 2" },
    { clave: "c3", nombre: "Precio", etiqueta: "Precio · columna 3" },
  ],
  filas: [{ numero: 2, valores: ["A1", "Yerba", "1000"] }],
  hojas: [{ valor: 1, etiqueta: "CSV" }],
  total: 2,
};
const importacion = (extra = {}) => ({
  id: "0b8f1c3e-8d6a-4f0e-9c1b-2a3d4e5f6a7b",
  archivo: "lista.csv",
  estado: "validado",
  opciones: { tipo_precio: "neto" },
  resumen: { total: 2, crear: 1, actualizar: 0, sin_cambios: 0, omitir: 0, error: 1 },
  resultado: {},
  siguiente_lote: 0,
  total_lotes: 1,
  muestra: [
    { fila: 2, sku: "A1", producto: "Yerba", presentacion: "", accion: "crear", mensaje: "Producto nuevo.", precio_anterior: null, precio_final: 1000 },
    { fila: 3, sku: "", producto: "", presentacion: "", accion: "error", mensaje: "Falta el código / SKU.", precio_anterior: null, precio_final: null },
  ],
  ...extra,
});

describe("Admin · Importar catálogo", () => {
  it("recorre los 3 pasos: leer, revisar y cargar solo las filas correctas", async () => {
    let cuerpoLote;
    servidorMock.use(
      mock.get(`${BASE}/historial`, () => HttpResponse.json({ ok: true, data: [] })),
      mock.post(`${BASE}/previsualizar`, () => HttpResponse.json({ ok: true, data: vista })),
      mock.post(`${BASE}/validar`, () => HttpResponse.json({ ok: true, data: importacion() })),
      mock.get(`${BASE}/:id`, () => HttpResponse.json({ ok: true, data: importacion() })),
      mock.post(`${BASE}/:id/lote`, async ({ request }) => {
        cuerpoLote = await request.json();
        return HttpResponse.json({
          ok: true,
          data: importacion({ estado: "completado", siguiente_lote: 1, resultado: { crear: 1, error: 1, productos_nuevos: 1, categorias_nuevas: 0 } }),
        });
      }),
    );
    renderizar(<ImportacionPage />);

    // Paso 1
    await userEvent.upload(screen.getByLabelText("Archivo a importar"), new File(["x"], "lista.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: "Leer archivo" }));

    // Paso 2: columnas sugeridas por sus títulos
    expect(await screen.findByText("2 filas encontradas.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Código / SKU" })).toHaveValue("c1");
    expect(screen.getByRole("combobox", { name: "Precio" })).toHaveValue("c3");
    await userEvent.click(screen.getByRole("button", { name: "Revisar sin cargar nada" }));

    // Paso 3: hay que aceptar omitir la fila con error antes de cargar
    const confirmar = await screen.findByRole("button", { name: "Confirmar e importar" });
    expect(confirmar).toBeDisabled();
    expect(screen.getByText("Falta el código / SKU.")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Importar solo las filas correctas/));
    await userEvent.click(confirmar);

    expect(await screen.findByText("Listo. Productos nuevos: 1 · Categorías nuevas: 0.")).toBeInTheDocument();
    expect(cuerpoLote).toEqual({ indice: 0, confirmar: true, omitir_errores: true });
    expect(within(screen.getByLabelText(/Lotes guardados/).parentElement).getByText("Lotes guardados: 1 de 1")).toBeInTheDocument();
  });

  it("muestra el error del servidor al leer un archivo inválido", async () => {
    servidorMock.use(
      mock.get(`${BASE}/historial`, () => HttpResponse.json({ ok: true, data: [] })),
      mock.post(`${BASE}/previsualizar`, () =>
        HttpResponse.json({ ok: false, codigo: "ARCHIVO_ILEGIBLE", mensaje: "No hay encabezados en esa fila.", detalles: [] }, { status: 400 }),
      ),
    );
    renderizar(<ImportacionPage />);
    await userEvent.upload(screen.getByLabelText("Archivo a importar"), new File(["x"], "lista.csv"));
    await userEvent.click(screen.getByRole("button", { name: "Leer archivo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay encabezados en esa fila.");
  });
});
