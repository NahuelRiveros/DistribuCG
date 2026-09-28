import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { proyecto } from "compartido/proyecto.js";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import CuotasPage from "./cuotas_page.jsx";
import MediosPage from "./medios_page.jsx";
import PromocionesPage from "./promociones_page.jsx";

// Config fija, sin los campos opcionales (como la inicial del proyecto): no depende de los datos cargados.
const CONFIG = {
  medios: proyecto.pagos.medios.map(({ logos, ...m }) => ({
    ...m,
    en_tienda: m.valor !== "otro",
    descuento: m.valor === "transferencia" ? 10 : 0,
    ...(logos ? { logos } : {}),
  })),
  datos_transferencia: { titular: "Tienda SA", cuit: null, banco: null, cbu: "2850590940090418135201", alias: "TIENDA.PAGOS" },
  financiacion: [{ nombre: "Mercado Pago", medio: "mercado_pago", logos: ["mercado_pago"], planes: [{ cuotas: 3, interes: 0 }] }],
  promociones: [{ banco: "Banco Dos", detalle: "10% de reintegro", dias: ["lunes"], hasta: "2099-12-31" }],
  cinta: null,
};

function simular({ guardar } = {}) {
  const enviados = [];
  localStorage.setItem(CLAVE_SESION, "token");
  servidorMock.use(
    mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 1, nombre: "Ana", email: "a@a.com", roles: ["admin"] } })),
    mock.get(`${API}/configuracion/pagos/editar`, () => HttpResponse.json({ ok: true, data: { valor: CONFIG, version: null, historial: [] } })),
    mock.put(`${API}/configuracion/pagos`, async ({ request }) => {
      const cuerpo = await request.json();
      enviados.push(cuerpo);
      if (guardar) return guardar();
      return HttpResponse.json({ ok: true, data: { valor: cuerpo.valor, version: "2026-09-28T12:00:00.000Z", historial: [] } });
    }),
  );
  return enviados;
}
const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
const fila = async (nombre) => (await screen.findByText(nombre, { selector: "p" })).closest("li");

describe("Configuración · Medios de pago", () => {
  it("una fila por medio (sin el interno 'Otro'), recién abierta sin cambios", async () => {
    simular();
    renderizar(<MediosPage />, { ruta: "/admin/configuracion" });

    expect(await screen.findByText("Sin cambios.")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Medios de pago" })).queryByText("Otro medio")).not.toBeInTheDocument();
    const transferencia = await fila("Transferencia bancaria");
    expect(within(transferencia).getByText("10% OFF")).toBeInTheDocument();
    expect(within(transferencia).getByText("Alias TIENDA.PAGOS")).toBeInTheDocument();
  });

  it("Editar transferencia muestra descuento y CBU en el mismo lugar, y guarda todo junto", async () => {
    const enviados = simular();
    renderizar(<MediosPage />, { ruta: "/admin/configuracion" });

    const transferencia = await fila("Transferencia bancaria");
    await userEvent.click(within(transferencia).getByRole("button", { name: /^Editar/ }));
    const descuento = within(transferencia).getByLabelText(/^Descuento/);
    await userEvent.clear(descuento);
    await userEvent.type(descuento, "15");
    expect(within(transferencia).getByLabelText(/^CBU/)).toHaveValue("2850590940090418135201");

    await guardar();
    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].valor.medios.find((m) => m.valor === "transferencia").descuento).toBe(15);
    expect(enviados[0].valor.datos_transferencia).toEqual(CONFIG.datos_transferencia);
  });

  it("un CBU mal tipeado no se guarda y el error queda a la vista", async () => {
    const enviados = simular();
    renderizar(<MediosPage />, { ruta: "/admin/configuracion" });

    const transferencia = await fila("Transferencia bancaria");
    await userEvent.click(within(transferencia).getByRole("button", { name: /^Editar/ }));
    const cbu = within(transferencia).getByLabelText(/^CBU/);
    await userEvent.clear(cbu);
    await userEvent.type(cbu, "2850590940090418135202");
    await guardar();

    expect(await screen.findByText("El CBU no es válido: revisá los 22 números (tiene dígitos de control)")).toBeInTheDocument();
    expect(enviados).toHaveLength(0);
  });

  it("apagar un medio con el interruptor lo deja fuera de la tienda", async () => {
    const enviados = simular();
    renderizar(<MediosPage />, { ruta: "/admin/configuracion" });

    await userEvent.click(within(await fila("Efectivo")).getByRole("switch"));
    expect(within(await fila("Efectivo")).getByText("No se ofrece")).toBeInTheDocument();
    await guardar();
    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].valor.medios.find((m) => m.valor === "efectivo").en_tienda).toBe(false);
  });
});

describe("Configuración · Cuotas", () => {
  it("agrega GoCuotas y un plan con interés exige el CFT", async () => {
    const enviados = simular();
    renderizar(<CuotasPage />, { ruta: "/admin/configuracion/cuotas" });

    await userEvent.click(await screen.findByRole("button", { name: "GoCuotas (tarjeta de débito)" }));
    const lista = screen.getByRole("list", { name: "Formas de pago en cuotas" });
    const gocuotas = [...lista.children].at(-1);
    expect(within(gocuotas).getByLabelText(/^Nombre/)).toHaveValue("GoCuotas (tarjeta de débito)");

    await userEvent.selectOptions(within(gocuotas).getByLabelText("Tipo"), "con");
    await userEvent.type(within(gocuotas).getByLabelText(/^Recargo/), "20");
    await guardar();
    expect(await within(gocuotas).findByText("Con interés, completá el CFT (lo exige la ley)")).toBeInTheDocument();
    expect(enviados).toHaveLength(0);

    await userEvent.type(within(gocuotas).getByLabelText(/^CFT/), "CFTEA 40 %");
    await guardar();
    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].valor.financiacion.at(-1)).toEqual(
      expect.objectContaining({
        nombre: "GoCuotas (tarjeta de débito)",
        medio: "tarjeta",
        logos: ["go_cuotas"],
        planes: [expect.objectContaining({ cuotas: 3, interes: 20, cft: "CFTEA 40 %", activo: true })],
      }),
    );
  });
});

describe("Configuración · Promociones", () => {
  it("agrega una promoción con días", async () => {
    const enviados = simular();
    renderizar(<PromocionesPage />, { ruta: "/admin/configuracion/promociones" });

    const promos = (await screen.findByRole("heading", { level: 2, name: "Promociones bancarias" })).closest("section");
    await userEvent.click(within(promos).getByRole("button", { name: "Agregar promoción" }));
    await userEvent.type(within(promos).getAllByLabelText(/^Banco/).at(-1), "Banco Uno");
    await userEvent.type(within(promos).getAllByLabelText(/^Beneficio/).at(-1), "30% de reintegro");
    await userEvent.click(within(promos).getAllByRole("checkbox", { name: "jueves" }).at(-1));
    await guardar();

    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].valor.promociones.at(-1)).toEqual(expect.objectContaining({ banco: "Banco Uno", detalle: "30% de reintegro", dias: ["jueves"], activo: true }));
  });

  it("si otra persona guardó mientras tanto, lo avisa y ofrece recargar", async () => {
    simular({ guardar: () => HttpResponse.json({ ok: false, codigo: "CONFIGURACION_CAMBIO", mensaje: "Otra persona cambió", detalles: [] }, { status: 409 }) });
    renderizar(<PromocionesPage />, { ruta: "/admin/configuracion/promociones" });

    await userEvent.click(await screen.findByRole("checkbox", { name: "Usar un texto propio" }));
    await userEvent.type(screen.getByLabelText(/^Texto de la cinta/), "¡Envío gratis!");
    await guardar();
    expect(await screen.findByText(/Otra persona guardó cambios mientras editabas/)).toBeInTheDocument();
  });
});
