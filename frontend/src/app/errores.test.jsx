import { render, screen } from "@testing-library/react";
import { http as mock, HttpResponse } from "msw";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import AvisoServidor from "@/componentes/sistema/aviso_servidor.jsx";
import ErrorPage from "./error_page.jsx";

function PantallaQueFalla({ mensaje }) {
  throw new Error(mensaje);
}

function renderizarConError(mensaje) {
  const router = createMemoryRouter([
    {
      element: (
        <>
          <nav>Navbar</nav>
          <Outlet />
        </>
      ),
      children: [{ errorElement: <ErrorPage />, children: [{ path: "/", element: <PantallaQueFalla mensaje={mensaje} /> }] }],
    },
  ]);
  render(<RouterProvider router={router} />);
}

describe("Página de error", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {})); // React loguea el error capturado
  afterEach(() => vi.restoreAllMocks());

  it("si una pantalla falla, muestra el error en su lugar y el navbar sigue", () => {
    renderizarConError("se rompió");

    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Navbar")).toBeInTheDocument();
  });

  it("si falta un archivo de una versión vieja, pide recargar", () => {
    renderizarConError("Failed to fetch dynamically imported module: /assets/carrito_page-abc.js");

    expect(screen.getByRole("heading", { name: "Hay una versión nueva del sitio" })).toBeInTheDocument();
  });
});

describe("Aviso de servidor", () => {
  it("con el servidor bien no muestra nada", async () => {
    let consultado = false;
    servidorMock.use(
      mock.get(`${API}/salud`, () => {
        consultado = true;
        return HttpResponse.json({ ok: true });
      }),
    );
    renderizar(<AvisoServidor />);

    await vi.waitFor(() => expect(consultado).toBe(true));
    expect(screen.queryByText(/servidor/i)).not.toBeInTheDocument();
  });

  it("si no responde avisa, y cuando vuelve el aviso desaparece", async () => {
    let vivo = false;
    servidorMock.use(mock.get(`${API}/salud`, () => (vivo ? HttpResponse.json({ ok: true }) : HttpResponse.error())));
    renderizar(<AvisoServidor />);

    expect(await screen.findByText("Sin conexión con el servidor")).toBeInTheDocument();
    vivo = true;
    await vi.waitFor(() => expect(screen.queryByText("Sin conexión con el servidor")).not.toBeInTheDocument(), { timeout: 7000 });
  }, 10_000);
});
