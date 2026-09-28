import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http as mock, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { CLAVE_SESION } from "@/api/http.js";
import { API, servidorMock } from "@/test/servidor_mock.js";
import { renderizar } from "@/test/renderizar.jsx";
import UsuariosPage from "./usuarios_page.jsx";

const usuario = (extra) => ({
  apellido: null,
  activo: true,
  ultimo_login: null,
  creado_en: "2026-09-28T12:00:00Z",
  gestionable: true,
  motivo_no_gestionable: null,
  ...extra,
});
const YO = usuario({ id: 1, nombre: "Ana", email: "ana@a.com", rol: "admin", roles: ["admin"], gestionable: false, motivo_no_gestionable: "Tu propio usuario no se modifica desde acá." });
const JUAN = usuario({ id: 2, nombre: "Juan", apellido: "Pérez", email: "juan@a.com", rol: "staff", roles: ["staff"], ultimo_login: "2026-09-27T10:00:00Z" });

/** Simula /api/usuarios recordando los cambios, y devuelve lo que se envió. */
function simular() {
  let lista = [YO, JUAN];
  const enviados = [];
  localStorage.setItem(CLAVE_SESION, "token");
  servidorMock.use(
    mock.get(`${API}/auth/yo`, () => HttpResponse.json({ ok: true, data: { id: 1, nombre: "Ana", email: "ana@a.com", roles: ["admin"] } })),
    mock.get(`${API}/usuarios`, () => HttpResponse.json({ ok: true, data: lista, paginacion: { pagina: 1, limite: 20, total: lista.length, total_paginas: 1 } })),
    mock.post(`${API}/usuarios`, async ({ request }) => {
      const cuerpo = await request.json();
      enviados.push(["crear", cuerpo]);
      const nuevo = usuario({ id: 3, ...cuerpo, roles: [cuerpo.rol] });
      lista = [...lista, nuevo];
      return HttpResponse.json({ ok: true, data: nuevo }, { status: 201 });
    }),
    mock.patch(`${API}/usuarios/:id/estado`, async ({ params, request }) => {
      const { activo } = await request.json();
      enviados.push(["estado", Number(params.id), activo]);
      lista = lista.map((u) => (u.id === Number(params.id) ? { ...u, activo } : u));
      return HttpResponse.json({ ok: true, data: lista.find((u) => u.id === Number(params.id)) });
    }),
    mock.put(`${API}/usuarios/:id/contrasena`, async ({ params, request }) => {
      enviados.push(["contrasena", Number(params.id), await request.json()]);
      return HttpResponse.json({ ok: true, data: JUAN });
    }),
  );
  return enviados;
}

const fila = async (texto) => (await screen.findAllByText(texto)).map((el) => el.closest("tr")).find(Boolean);

describe("Panel · Usuarios", () => {
  it("lista los usuarios y solo ofrece acciones sobre los que se pueden modificar", async () => {
    simular();
    renderizar(<UsuariosPage />, { ruta: "/admin/usuarios" });

    const juan = await fila("Juan Pérez");
    expect(within(juan).getByText("Personal")).toBeInTheDocument();
    expect(within(juan).getByRole("button", { name: "Editar a Juan" })).toBeInTheDocument();

    const yo = await fila("Ana");
    expect(within(yo).queryByRole("button")).not.toBeInTheDocument();
    expect(within(yo).getByText("Tu propio usuario no se modifica desde acá.")).toBeInTheDocument();
    expect(within(yo).getByText("Nunca ingresó")).toBeInTheDocument();
  });

  it("un admin crea personal: no puede elegir el rol Administrador", async () => {
    const enviados = simular();
    renderizar(<UsuariosPage />, { ruta: "/admin/usuarios" });

    await userEvent.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
    const dialogo = screen.getByRole("dialog", { name: "Nuevo usuario" });
    const rol = within(dialogo).getByLabelText(/^Rol/);
    expect(within(rol).getAllByRole("option").map((o) => o.textContent)).toEqual(["Personal", "Cliente"]);

    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), "Luis");
    await userEvent.type(within(dialogo).getByLabelText(/^Email/), "luis@a.com");
    await userEvent.type(within(dialogo).getByLabelText(/^Contraseña inicial/), "clave-segura-123");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Crear usuario" }));

    await waitFor(() => expect(enviados[0]).toEqual(["crear", { nombre: "Luis", apellido: "", email: "luis@a.com", rol: "staff", contrasena: "clave-segura-123" }]));
    expect(await screen.findByText("Usuario creado")).toBeInTheDocument();
    expect(await fila("Luis")).toBeTruthy();
  });

  it("desactivar pide confirmación; reactivar se aplica directo", async () => {
    const enviados = simular();
    renderizar(<UsuariosPage />, { ruta: "/admin/usuarios" });

    await userEvent.click(within(await fila("Juan Pérez")).getByRole("button", { name: "Desactivar a Juan" }));
    expect(enviados).toHaveLength(0);
    await userEvent.click(within(screen.getByRole("dialog", { name: "¿Desactivar a Juan?" })).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(enviados).toEqual([["estado", 2, false]]));
    expect(within(await fila("Juan Pérez")).getByText("Inactivo")).toBeInTheDocument();

    await userEvent.click(within(await fila("Juan Pérez")).getByRole("button", { name: "Reactivar a Juan" }));
    await waitFor(() => expect(enviados[1]).toEqual(["estado", 2, true]));
  });

  it("cambiar la contraseña exige repetirla igual", async () => {
    const enviados = simular();
    renderizar(<UsuariosPage />, { ruta: "/admin/usuarios" });

    await userEvent.click(within(await fila("Juan Pérez")).getByRole("button", { name: "Cambiar la contraseña de Juan" }));
    const dialogo = screen.getByRole("dialog", { name: "Cambiar contraseña" });
    await userEvent.type(within(dialogo).getByLabelText(/^Nueva contraseña/), "otra-clave-456");
    await userEvent.type(within(dialogo).getByLabelText(/^Repetir contraseña/), "otra-clave-789");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cambiar contraseña" }));
    expect(await within(dialogo).findByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(enviados).toHaveLength(0);

    await userEvent.clear(within(dialogo).getByLabelText(/^Repetir contraseña/));
    await userEvent.type(within(dialogo).getByLabelText(/^Repetir contraseña/), "otra-clave-456");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cambiar contraseña" }));
    await waitFor(() => expect(enviados).toEqual([["contrasena", 2, { contrasena: "otra-clave-456", confirmar: "otra-clave-456" }]]));
  });
});
