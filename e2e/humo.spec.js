import { expect, test } from "@playwright/test";

test("el Home carga con navbar, secciones y footer del cliente", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Las secciones dependen del cliente (clientes/<id>/home.js): alcanza con que haya más de una
  await expect(page.locator("main section").nth(1)).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Todos los derechos reservados");
});

test("el login rechaza credenciales incorrectas con un mensaje claro", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("nadie@ejemplo.com");
  await page.getByLabel("Contraseña", { exact: false }).first().fill("clave-incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
});

test("en celular el menú es lateral, navega y se cierra solo", async ({ page, isMobile }) => {
  test.skip(!isMobile, "El menú lateral es solo para celulares");
  await page.goto("/");

  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Menú" });
  await expect(menu).toBeVisible();
  const ancho = page.viewportSize().width;
  // Termina de entrar (animación) pegado al borde derecho, y deja ver el fondo oscurecido
  await expect.poll(async () => Math.round((await menu.boundingBox()).x + (await menu.boundingBox()).width)).toBe(ancho);
  expect((await menu.boundingBox()).width).toBeLessThan(ancho);

  // Por dirección y no por texto: el nombre ("Productos", "Tienda"…) lo elige cada cliente
  await menu.locator("a[href='/catalogo']").click();
  await expect(page).toHaveURL(/\/catalogo/);
  await expect(menu).toBeHidden();
});
