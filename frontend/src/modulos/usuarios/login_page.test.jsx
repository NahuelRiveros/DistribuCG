import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import LoginPage from "./login_page.jsx";

function renderizarLogin(ruta = "/login") {
  return renderizar(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Página de inicio</p>} />
      <Route path="/mis-pedidos" element={<p>Mis pedidos</p>} />
    </Routes>,
    { ruta },
  );
}

async function completar(email, contrasena) {
  if (email) await userEvent.type(screen.getByLabelText(/Email/), email);
  if (contrasena) await userEvent.type(screen.getByLabelText(/Contraseña/, { selector: "input" }), contrasena);
  await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("LoginPage", () => {
  it("valida los campos antes de llamar al servidor", async () => {
    renderizarLogin();
    await completar("no-es-un-email", "");

    expect(await screen.findByText("Ingresá un email válido")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña")).toBeInTheDocument();
  });

  it("muestra el mensaje del servidor si las credenciales son incorrectas", async () => {
    servidorMock.use(
      mock.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { ok: false, codigo: "CREDENCIALES_INCORRECTAS", mensaje: "Email o contraseña incorrectos.", detalles: [] },
          { status: 401 },
        ),
      ),
    );
    renderizarLogin();
    await completar("ana@test.com", "clave-mala");

    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it("guarda la sesión y vuelve a la página que pidió el login", async () => {
    servidorMock.use(
      mock.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          ok: true,
          data: { token: "token-de-prueba", usuario: { id: 1, nombre: "Ana", email: "ana@test.com", roles: ["cliente"] } },
        }),
      ),
    );
    renderizarLogin("/login?volver=%2Fmis-pedidos");
    await completar("ana@test.com", "clave-segura-123");

    expect(await screen.findByText("Mis pedidos")).toBeInTheDocument();
    expect(localStorage.getItem(CLAVE_SESION)).toBe("token-de-prueba");
  });

  it("no redirige a sitios externos aunque lo pida la URL", async () => {
    servidorMock.use(
      mock.post(`${API}/auth/login`, () =>
        HttpResponse.json({ ok: true, data: { token: "t", usuario: { id: 1, nombre: "Ana", roles: [] } } }),
      ),
    );
    renderizarLogin("/login?volver=https%3A%2F%2Fsitio-malicioso.com");
    await completar("ana@test.com", "clave-segura-123");

    expect(await screen.findByText("Página de inicio")).toBeInTheDocument();
  });
});
