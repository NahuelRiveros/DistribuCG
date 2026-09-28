import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Enlace from "./enlace.jsx";

function menuEn(ruta) {
  const { unmount } = render(
    <MemoryRouter initialEntries={[ruta]}>
      {[
        ["/", "Inicio"],
        ["/#contacto", "Contacto"],
        ["/catalogo", "Productos"],
        ["/catalogo?oferta=1", "Ofertas"],
      ].map(([a, texto]) => (
        <Enlace key={a} a={a} claseActiva="activo">
          {texto}
        </Enlace>
      ))}
    </MemoryRouter>,
  );
  const activos = ["Inicio", "Contacto", "Productos", "Ofertas"].filter((t) => screen.getByRole("link", { name: t }).classList.contains("activo"));
  unmount();
  return activos;
}

describe("Enlace · link activo", () => {
  it("en el inicio solo marca 'Inicio' (no todas las secciones del inicio)", () => {
    expect(menuEn("/")).toEqual(["Inicio"]);
  });

  it("en una sección del inicio marca esa sección", () => {
    expect(menuEn("/#contacto")).toEqual(["Contacto"]);
  });

  it("'Ofertas' se marca solo con su filtro", () => {
    expect(menuEn("/catalogo?oferta=1")).toEqual(["Productos", "Ofertas"]);
    expect(menuEn("/catalogo?categoria=3")).toEqual(["Productos"]);
  });
});
