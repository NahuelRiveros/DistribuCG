import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import CarritoPage from "./paginas/carrito_page.jsx";
import ConfirmarPedidoPage from "./paginas/confirmar_pedido_page.jsx";
import PedidoPanelPage from "./admin/pedido_panel_page.jsx";
import AgregarAlPedido from "./componentes/agregar_al_pedido.jsx";
import CarritoIcono from "./componentes/carrito_icono.jsx";
import { leerCarritoInvitado } from "./utils/carrito_invitado.js";
import { mediosTienda, totalConMedio } from "compartido/reglas/pagos.js";
import { proyecto } from "compartido/proyecto.js";

const sinEspacios = (t) => t.replace(/\s/g, " ");
const linea = (extra = {}) => ({
  item_id: 1,
  variante_id: 100,
  producto_id: 10,
  slug: "yerba",
  producto: "Yerba",
  presentacion: "500 g",
  sku: "Y500",
  imagen: null,
  cantidad: 2,
  precio: "1000.00",
  iva_porcentaje: "21.00",
  precio_final_unitario: 1210,
  subtotal_neto: 2000,
  iva: 420,
  subtotal_final: 2420,
  precio_cambio: false,
  problema: null,
  mensaje: null,
  ...extra,
});
const carritoCon = (items) => ({
  items,
  totales: { subtotal_neto: 2000, iva: 420, total: 2420 },
  cantidad_unidades: 2,
  pedido_minimo: null,
  se_puede_enviar: items.every((l) => !l.problema),
});

function sesion(roles = ["cliente"]) {
  localStorage.setItem(CLAVE_SESION, "token");
  servidorMock.use(mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 7, nombre: "Ana", email: "ana@a.com", roles } })));
}

function Ubicacion() {
  const { pathname, search } = useLocation();
  return <p data-testid="ubicacion">{pathname + search}</p>;
}

describe("Tienda · carrito de visitante", () => {
  it("agregar sin cuenta guarda en el navegador y actualiza el ícono del navbar", async () => {
    servidorMock.use(mock.post(`${API}/tienda/carrito/cotizar`, async ({ request }) => {
      const { items } = await request.json();
      return HttpResponse.json({ ok: true, data: carritoCon(items.map((i) => linea({ item_id: null, cantidad: i.cantidad }))) });
    }));
    renderizar(
      <>
        <CarritoIcono />
        <AgregarAlPedido variante={{ id: 100, disponibilidad: "disponible" }} />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Sumar uno" }));
    await userEvent.click(screen.getByRole("button", { name: "Agregar al pedido" }));

    expect(await screen.findByText("Agregado al pedido (2)")).toBeInTheDocument();
    expect(leerCarritoInvitado().items).toEqual([{ variante_id: 100, cantidad: 2 }]);
    expect(await screen.findByRole("link", { name: "Mi pedido: 1 producto(s)" })).toBeInTheDocument();
  });

  it("muestra el carrito calculado por el servidor y pide cuenta para continuar", async () => {
    localStorage.setItem(`${proyecto.cliente}:carrito_invitado:v1`, JSON.stringify({ clave: "x", items: [{ variante_id: 100, cantidad: 2 }] }));
    servidorMock.use(mock.post(`${API}/tienda/carrito/cotizar`, () => HttpResponse.json({ ok: true, data: carritoCon([linea({ item_id: null })]) })));
    renderizar(
      <Routes>
        <Route path="/carrito" element={<CarritoPage />} />
        <Route path="/login" element={<Ubicacion />} />
      </Routes>,
      { ruta: "/carrito" },
    );

    expect(await screen.findByRole("link", { name: "Yerba" })).toBeInTheDocument();
    expect(sinEspacios(screen.getByTestId("total").textContent)).toBe("$ 2.420,00");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("/login?volver=%2Fpedido%2Fconfirmar");
  });

  it("no deja continuar si un producto se quedó sin stock", async () => {
    localStorage.setItem(`${proyecto.cliente}:carrito_invitado:v1`, JSON.stringify({ clave: "x", items: [{ variante_id: 100, cantidad: 2 }] }));
    const agotado = linea({ item_id: null, problema: "sin_stock", mensaje: "Yerba (500 g) no tiene stock." });
    servidorMock.use(mock.post(`${API}/tienda/carrito/cotizar`, () => HttpResponse.json({ ok: true, data: carritoCon([agotado]) })));
    renderizar(<CarritoPage />, { ruta: "/carrito" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Yerba (500 g) no tiene stock.");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });
});

describe("Tienda · confirmar pedido", () => {
  function simular({ enviar } = {}) {
    let perfil = null;
    const enviados = [];
    servidorMock.use(
      mock.get(`${API}/tienda/carrito`, () => HttpResponse.json({ ok: true, data: carritoCon([linea()]) })),
      mock.get(`${API}/tienda/perfil`, () => HttpResponse.json({ ok: true, data: perfil })),
      mock.put(`${API}/tienda/perfil`, async ({ request }) => {
        perfil = await request.json();
        return HttpResponse.json({ ok: true, data: perfil });
      }),
      mock.post(`${API}/tienda/pedidos`, async ({ request }) => {
        enviados.push(await request.json());
        return enviar ? enviar() : HttpResponse.json({ ok: true, data: { id: 55 } }, { status: 201 });
      }),
    );
    return enviados;
  }

  it("pide los datos de entrega, después envía con lo que el cliente vio", async () => {
    sesion();
    const enviados = simular();
    renderizar(
      <Routes>
        <Route path="/pedido/confirmar" element={<ConfirmarPedidoPage />} />
        <Route path="/mis-pedidos/:id" element={<Ubicacion />} />
      </Routes>,
      { ruta: "/pedido/confirmar" },
    );

    await userEvent.type(await screen.findByLabelText(/^Teléfono/), "387 555 1234");
    await userEvent.type(screen.getByLabelText(/^Dirección/), "Belgrano 123");
    await userEvent.type(screen.getByLabelText(/^Localidad/), "Salta");
    await userEvent.selectOptions(screen.getByLabelText(/^Provincia/), "Salta");
    await userEvent.click(screen.getByRole("button", { name: "Guardar y continuar" }));

    expect(await screen.findByText(/Belgrano 123, Salta, Salta/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Retiro en el local" }));
    await userEvent.type(screen.getByLabelText("Notas para el pedido (opcional)"), "Paso a la tarde");
    // Sin elegir cómo pagar no se envía
    await userEvent.click(screen.getByRole("button", { name: "Enviar pedido" }));
    expect(await screen.findByText("Elegí cómo vas a pagar.")).toBeInTheDocument();
    expect(enviados).toHaveLength(0);

    await userEvent.click(screen.getByRole("radio", { name: /^Efectivo/ }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar pedido" }));

    await waitFor(() => expect(screen.getByTestId("ubicacion")).toHaveTextContent("/mis-pedidos/55"));
    expect(enviados[0]).toMatchObject({
      modalidad_entrega: "retiro",
      medio_pago: "efectivo",
      notas: "Paso a la tarde",
      esperado: [{ variante_id: 100, cantidad: 2, precio_final_unitario: 1210 }],
    });
    expect(enviados[0].clave).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("si cambió un precio, avisa en vez de enviar", async () => {
    sesion();
    simular({
      enviar: () =>
        HttpResponse.json(
          { ok: false, codigo: "CARRITO_CAMBIO", mensaje: "Cambió el precio o la cantidad de algún producto. Revisá el pedido y confirmá de nuevo.", detalles: [] },
          { status: 409 },
        ),
    });
    servidorMock.use(mock.get(`${API}/tienda/perfil`, () => HttpResponse.json({ ok: true, data: { telefono: "1", direccion: "A", localidad: "B", provincia: "Salta" } })));
    renderizar(<ConfirmarPedidoPage />, { ruta: "/pedido/confirmar" });

    await userEvent.click(await screen.findByRole("radio", { name: /^Efectivo/ }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar pedido" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cambió el precio o la cantidad");
  });

  it("el medio con descuento baja el total del resumen y se envía al servidor", async () => {
    // El % sale de la configuración: el test no depende de los datos cargados
    const medio = mediosTienda().find((m) => m.descuento > 0);
    if (!medio) return;
    sesion();
    const enviados = simular();
    servidorMock.use(mock.get(`${API}/tienda/perfil`, () => HttpResponse.json({ ok: true, data: { telefono: "1", direccion: "A", localidad: "B", provincia: "Salta" } })));
    renderizar(<ConfirmarPedidoPage />, { ruta: "/pedido/confirmar" });

    await userEvent.click(await screen.findByRole("radio", { name: new RegExp(`^${medio.etiqueta}`) }));
    const esperado = totalConMedio(2420, medio.valor);
    expect(sinEspacios(screen.getByTestId("descuento").textContent)).toBe(`− ${sinEspacios(new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(esperado.descuento))}`);
    expect(sinEspacios(screen.getByTestId("total").textContent)).toBe(sinEspacios(new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(esperado.total)));

    await userEvent.click(screen.getByRole("button", { name: "Enviar pedido" }));
    await waitFor(() => expect(enviados[0]).toMatchObject({ medio_pago: medio.valor }));
  });
});

describe("Panel · detalle del pedido", () => {
  const pedido = (extra = {}) => ({
    id: 55,
    estado: "pendiente",
    estado_cobro: "pendiente",
    modalidad_entrega: "envio",
    entrega: { nombre: "Ana", email: "ana@a.com", direccion: "Belgrano 123", localidad: "Salta", provincia: "Salta", telefono: "387" },
    notas: null,
    subtotal_neto: "2000.00",
    total_iva: "420.00",
    total: "2420.00",
    monto_cobrado: "0.00",
    saldo: 2420,
    creado_en: "2026-09-25T12:00:00Z",
    items: [{ id: 1, nombre_producto: "Yerba", presentacion: "500 g", sku: "Y500", cantidad: 2, precio_final_unitario: "1210.00", subtotal_final: "2420.00" }],
    historial: [{ id: 1, estado_nuevo: "pendiente", motivo: "Pedido enviado por el cliente", creado_en: "2026-09-25T12:00:00Z", usuario: { nombre: "Ana" } }],
    cobros: [],
    ...extra,
  });

  function renderizarDetalle() {
    return renderizar(
      <Routes>
        <Route path="/admin/pedidos/:id" element={<PedidoPanelPage />} />
      </Routes>,
      { ruta: "/admin/pedidos/55" },
    );
  }

  it("ofrece solo los cambios permitidos y pide motivo para cancelar", async () => {
    sesion(["staff"]);
    const cambios = [];
    servidorMock.use(
      mock.get(`${API}/pedidos/55`, () => HttpResponse.json({ ok: true, data: pedido() })),
      mock.patch(`${API}/pedidos/55/estado`, async ({ request }) => {
        const cuerpo = await request.json();
        cambios.push(cuerpo);
        return HttpResponse.json({ ok: true, data: pedido({ estado: cuerpo.estado }) });
      }),
    );
    renderizarDetalle();

    const acciones = await screen.findByRole("group", { name: "Cambiar estado" });
    expect(within(acciones).getAllByRole("button").map((b) => b.textContent)).toEqual(["Pasar a “En preparación”", "Cancelar pedido"]);

    await userEvent.click(within(acciones).getByRole("button", { name: "Cancelar pedido" }));
    const dialogo = screen.getByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Confirmar" }));
    expect(within(dialogo).getByRole("alert")).toHaveTextContent("Indicá el motivo del cambio.");
    expect(cambios).toHaveLength(0);

    await userEvent.type(within(dialogo).getByLabelText("Motivo"), "El cliente llamó para cancelar");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(cambios[0]).toEqual({ estado: "cancelado", motivo: "El cliente llamó para cancelar", estado_actual: "pendiente" }));
  });

  it("registra un cobro por el saldo si no se escribe monto", async () => {
    sesion(["staff"]);
    let cobro;
    let actual = pedido();
    servidorMock.use(
      mock.get(`${API}/pedidos/55`, () => HttpResponse.json({ ok: true, data: actual })),
      mock.post(`${API}/pedidos/55/cobros`, async ({ request }) => {
        cobro = await request.json();
        actual = pedido({ estado_cobro: "cobrado", monto_cobrado: "2420.00", saldo: 0 });
        return HttpResponse.json({ ok: true, data: actual }, { status: 201 });
      }),
    );
    renderizarDetalle();

    await userEvent.selectOptions(await screen.findByLabelText("Medio"), "transferencia");
    await userEvent.click(screen.getByRole("button", { name: "Registrar cobro" }));
    await waitFor(() => expect(cobro).toEqual({ monto: 2420, metodo: "transferencia", nota: null }));
    expect(await screen.findByText("El pedido está cobrado completo.")).toBeInTheDocument();
  });
});
