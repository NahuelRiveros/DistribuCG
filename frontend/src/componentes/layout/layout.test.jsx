import { screen, within } from "@testing-library/react";
import { http as mock, HttpResponse } from "msw";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { cliente } from "@/clientes/index.js";
import { renderizar } from "@/test/renderizar.jsx";
import Navbar from "./navbar.jsx";
import Footer from "./footer.jsx";

describe("Navbar", () => {
  it("muestra la marca, los links del cliente y el acceso para ingresar", () => {
    renderizar(<Navbar />);

    expect(within(screen.getByRole("banner")).getByText(cliente.marca.nombre)).toBeInTheDocument();
    for (const link of cliente.navbar.links) {
      expect(screen.getAllByRole("link", { name: link.etiqueta }).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/login");
  });

  it("en celulares abre el menú lateral y lo cierra con la X o con Escape", async () => {
    renderizar(<Navbar />);
    const boton = screen.getByRole("button", { name: "Abrir menú" });
    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument(); // cerrado: oculto

    await userEvent.click(boton);
    const menu = screen.getByRole("dialog", { name: "Menú" });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getByRole("link", { name: "Ingresar" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(within(menu).getByRole("button", { name: "Cerrar menú" }));
    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");

    await userEvent.click(boton);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument();
  });

  it("con sesión muestra \"Mi cuenta\" con los enlaces de los módulos y salir", async () => {
    localStorage.setItem(CLAVE_SESION, "token");
    servidorMock.use(mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 7, nombre: "Ana", email: "ana@a.com", roles: ["cliente"] } })));
    renderizar(<Navbar />);

    await userEvent.click(await screen.findByRole("button", { name: "Mi cuenta (Ana)" }));
    const cuenta = document.getElementById("menu-cuenta");
    expect(within(cuenta).getByRole("link", { name: "Mis pedidos" })).toHaveAttribute("href", "/mis-pedidos");
    expect(within(cuenta).getByRole("button", { name: "Salir" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Panel/ })).not.toBeInTheDocument(); // un cliente no ve el panel
  });
});

describe("Footer", () => {
  it("muestra las columnas y el titular del copyright", () => {
    renderizar(<Footer />);

    for (const columna of cliente.footer.columnas) {
      expect(screen.getByRole("heading", { name: columna.titulo })).toBeInTheDocument();
    }
    // El titular puede tener puntos o paréntesis ("López (Hnos.) S.R.L."): se busca como texto, no como patrón
    expect(screen.getByText((texto) => texto.includes(`© ${new Date().getFullYear()} ${cliente.footer.legal.titular}`))).toBeInTheDocument();
  });
});
