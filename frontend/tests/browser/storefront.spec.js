import { test, expect } from "@playwright/test";
const product = { id: 1, nombre: "Arroz largo fino", marca: "Marca de prueba", categoria: { id: 1, nombre: "Almacén" }, variedades: [{ id: 11, nombre: "Paquete 1 kg", precio: 1200, controla_stock: true, cantidad: 200, iva_porcentaje: 21 }] };
async function mockApi(page) {
  let cart = [];
  let submitted = [];
  await page.route((url) => url.pathname.startsWith("/api/"), async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, "");
    const method = request.method();
    const body = request.postDataJSON();
    let data = { ok: true, data: [] };
    if (path === "/distribuidora/productos") data = { ok: true, data: [{ ...product, id: url.searchParams.get("pagina") === "2" ? 2 : 1 }], total: 25, total_paginas: 2 };
    else if (path.startsWith("/distribuidora/productos/")) data = { ok: true, data: product };
    else if (path === "/distribuidora/catalogos/categorias") data = { ok: true, data: [{ id: 1, nombre: "Almacén", padre_id: null }] };
    else if (path === "/auth/login") data = { ok: true, token: "mock-session" };
    else if (path === "/auth/me") data = { ok: true, usuario: { usuario_id: 7, nombre: "Ana", apellido: "Cliente", roles: ["cliente"] } };
    else if (path === "/auth/register") data = { ok: true };
    else if (path === "/modulos/estado") data = { ok: true, modulos: { eccomerce_distribuidora: true } };
    else if (path === "/distribuidora/carrito/merge") {
      cart = body.items.map((i) => ({ ...i, item_id: 50, nombre: product.nombre, variante: "Paquete 1 kg", precio: 1200, precio_al_agregar: 1200, stock_disponible: 200, activo: true, variante_disponible: true }));
      data = { ok: true, data: cart };
    } else if (path === "/distribuidora/carrito") data = { ok: true, data: cart };
    else if (path.startsWith("/distribuidora/carrito/items/") && method === "PUT") {
      await new Promise((r) => setTimeout(r, 250));
      cart = cart.map((i) => ({ ...i, cantidad: body.cantidad })); data = { ok: true, data: cart };
    } else if (path.startsWith("/distribuidora/carrito/items/") && method === "DELETE") { cart = []; data = { ok: true, data: cart }; }
    else if (path === "/distribuidora/mi-perfil") data = { ok: true, data: { cuit: "20-12345678-9", direccion: "Av. Prueba 123", provincia: "Buenos Aires", localidad: "La Plata" } };
    else if (path === "/distribuidora/notas-pedido" && method === "POST") { submitted.push(body); cart = []; data = { ok: true, data: { id: 123, total: body.expectedItems[0].cantidad * 1200 } }; }
    else if (path === "/home/config") data = { ok: true, textos: {}, pilares: [], contactos: [] };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
  return { submitted };
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}
test("catálogo público, paginación y carrito visibles", async ({ page }, info) => {
  await mockApi(page);
  await page.goto("/distribuidora/catalogo");
  await expect(page.getByRole("heading", { name: "Productos", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver carrito, 0 unidades" })).toBeVisible();
  await noOverflow(page);
  if (info.project.name !== "desktop") {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
  }
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(page.getByText("Página 2 de 2")).toBeVisible();
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver carrito, 1 unidades" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Ver carrito, 1 unidades" })).toBeVisible();
});
test("el cliente conserva carrito al registrarse y confirma la cantidad guardada", async ({ page }) => {
  const api = await mockApi(page);
  await page.goto("/distribuidora/catalogo");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver carrito, 1 unidades" })).toBeVisible();
  await page.getByRole("link", { name: "Ver carrito, 1 unidades" }).click();
  await noOverflow(page);
  await expect(page.getByRole("button", { name: "Quitar Arroz largo fino" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar con el pedido" }).click();
  await expect(page).toHaveURL(/login\?returnTo=/);
  await page.getByRole("link", { name: "Crear cuenta", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Ana");
  await page.getByLabel("Apellido", { exact: true }).fill("Cliente");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Clave1234");
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Clave1234");
  await page.getByRole("button", { name: "Crear cuenta y continuar" }).click();
  await expect(page).toHaveURL(/distribuidora\/carrito$/);
  const quantity = page.getByRole("spinbutton", { name: "Cantidad de Arroz largo fino" });
  await expect(quantity).toHaveValue("1");
  await quantity.fill("12");
  await quantity.press("Tab");
  await expect(page.getByRole("button", { name: "Continuar con el pedido" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar con el pedido" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("12 × Arroz largo fino");
  await page.getByRole("button", { name: "Enviar pedido", exact: true }).click();
  await expect(page.getByRole("heading", { name: "¡Pedido #123 enviado!" })).toBeVisible();
  expect(api.submitted).toHaveLength(1);
  expect(api.submitted[0].expectedItems[0].cantidad).toBe(12);
  await noOverflow(page);
});
test("una falla de red muestra reintento y nunca catálogo vacío", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/distribuidora/productos?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ mensaje: "Temporal" }) }));
  await page.goto("/distribuidora/catalogo");
  await expect(page.getByRole("alert")).toContainText("No pudimos cargar los productos");
  await expect(page.getByRole("button", { name: "Reintentar", exact: true })).toBeVisible();
});
