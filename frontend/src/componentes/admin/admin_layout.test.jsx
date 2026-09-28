import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ROLES_PANEL } from "compartido/reglas/roles.js";
import { CLAVE_SESION } from "@/api/http.js";
import RutaProtegida from "@/componentes/acceso/ruta_protegida.jsx";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import AdminLayout from "./admin_layout.jsx";

function sesionComo(roles) {
  localStorage.setItem(CLAVE_SESION, "token-de-prueba");
  servidorMock.use(mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 1, nombre: "Ana", email: "a@a.com", roles } })));
}

function renderizarPanel(ruta = "/admin") {
  return renderizar(
    <Routes>
      <Route path="/" element={<p>Página de la tienda</p>} />
      <Route path="/login" element={<p>Pantalla de login</p>} />
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={ROLES_PANEL}>
            <AdminLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<p>Inicio del panel</p>} />
        <Route path="*" element={<p>Pantalla de una sección</p>} />
      </Route>
    </Routes>,
    { ruta },
  );
}

describe("Panel de administración", () => {
  it("Caja es un solo ítem; al entrar, el menú muestra sus pestañas y un botón para volver", async () => {
    sesionComo(["admin"]);
    renderizarPanel();

    let menu = (await screen.findAllByRole("navigation", { name: "Panel" }))[0];
    expect(within(menu).queryByRole("link", { name: "Calendario" })).not.toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("link", { name: "Caja" }));

    menu = screen.getAllByRole("navigation", { name: "Panel" })[0];
    expect(within(menu).getByRole("heading", { name: "Caja" })).toBeInTheDocument();
    expect(within(menu).getAllByRole("link").map((l) => l.textContent.trim())).toEqual(["Volver al panel", "Balance anual", "Calendario", "Categorías"]);

    await userEvent.click(within(menu).getByRole("link", { name: "Volver al panel" }));
    expect(await screen.findByText("Inicio del panel")).toBeInTheDocument();
    menu = screen.getAllByRole("navigation", { name: "Panel" })[0];
    expect(within(menu).getByRole("link", { name: "Productos" })).toBeInTheDocument();
  });

  it("entrando directo a una pestaña de Caja (ej. desde un link) el menú ya muestra las de Caja", async () => {
    sesionComo(["admin"]);
    renderizarPanel("/admin/caja/calendario");
    const menu = (await screen.findAllByRole("navigation", { name: "Panel" }))[0];
    expect(within(menu).getByRole("link", { name: "Calendario" })).toHaveAttribute("aria-current", "page");
  });

  it("muestra el menú lateral con las secciones de los módulos activos", async () => {
    sesionComo(["staff"]);
    renderizarPanel();

    expect(await screen.findByText("Inicio del panel")).toBeInTheDocument();
    const menu = screen.getAllByRole("navigation", { name: "Panel" })[0];
    expect(within(menu).getByRole("heading", { name: "Catálogo" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Productos" })).toHaveAttribute("href", "/admin/catalogo/productos");
    expect(within(menu).getByRole("link", { name: "Categorías" })).toHaveAttribute("href", "/admin/catalogo/categorias");
    expect(screen.getAllByRole("link", { name: "Ver tienda" })[0]).toHaveAttribute("href", "/");
    expect(within(menu).queryByRole("heading", { name: "Sistema" })).not.toBeInTheDocument(); // Usuarios: solo admin
    expect(within(menu).queryByRole("link", { name: "Caja" })).not.toBeInTheDocument(); // Caja: solo admin
  });

  it("un admin ve además la sección Sistema → Usuarios", async () => {
    sesionComo(["admin"]);
    renderizarPanel();

    const menu = (await screen.findAllByRole("navigation", { name: "Panel" }))[0];
    expect(within(menu).getByRole("heading", { name: "Sistema" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/admin/usuarios");
  });

  it("un cliente no entra al panel: vuelve a la tienda", async () => {
    sesionComo(["cliente"]);
    renderizarPanel();
    expect(await screen.findByText("Página de la tienda")).toBeInTheDocument();
  });

  it("sin sesión pide ingresar", async () => {
    renderizarPanel();
    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
  });
});
