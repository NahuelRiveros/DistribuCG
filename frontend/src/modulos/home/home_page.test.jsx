import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cliente } from "@/clientes/index.js";
import { renderizar } from "@/test/renderizar.jsx";
import HomePage from "./home_page.jsx";

describe("HomePage", () => {
  it("arma las secciones desde la configuración del cliente activo", () => {
    renderizar(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: `Somos ${cliente.marca.nombre}` })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comprar mayorista, sin vueltas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrega puntual" })).toBeInTheDocument();
  });

  it("muestra los pasos numerados y links de contacto seguros", () => {
    renderizar(<HomePage />);

    const pasos = within(document.getElementById("como-pedir"));
    expect(pasos.getByText("01")).toBeInTheDocument();
    expect(pasos.getByText("03")).toBeInTheDocument();

    const whatsapp = screen.getByRole("link", { name: "[Completar número]" });
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  });
});
