import { expect, test } from "@playwright/test";
import { ingresarComoAdmin } from "./ayudantes.js";

/** El menú del panel: en celular hay que abrirlo primero. */
async function menuPanel(page, isMobile) {
  if (isMobile) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  return page.getByRole("navigation", { name: "Panel" }).locator("visible=true");
}

test("Caja: se entra por su pestaña, se crea una categoría, se registra un egreso y se ve en el balance y en Excel", async ({ page, isMobile }, testInfo) => {
  // Cada proyecto (escritorio / celular) usa su propia categoría: corren a la vez sobre la misma base
  const categoria = `Publicidad ${testInfo.project.name}`;

  await ingresarComoAdmin(page);

  // 1) "Caja" es un solo ítem; al entrar, el menú muestra sus pestañas y "Volver al panel"
  await (await menuPanel(page, isMobile)).getByRole("link", { name: "Caja" }).click();
  await expect(page.getByRole("heading", { name: "Balance anual" })).toBeVisible();
  let menu = await menuPanel(page, isMobile);
  await expect(menu.getByRole("link", { name: "Volver al panel" })).toBeVisible();

  // 2) Nueva categoría de egresos
  await menu.getByRole("link", { name: "Categorías" }).click();
  await page.getByRole("button", { name: "Nueva categoría de egresos" }).click();
  await page.getByRole("dialog").getByLabel(/^Nombre/).fill(categoria);
  await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Categoría creada")).toBeVisible();

  // 3) Registrar un egreso hoy desde el calendario
  menu = await menuPanel(page, isMobile);
  await menu.getByRole("link", { name: "Calendario" }).click();
  await page.getByRole("button", { name: "Registrar ingreso o egreso" }).click();
  const alta = page.getByRole("dialog", { name: "Registrar movimiento" });
  await alta.getByLabel(/^Monto/).fill("1234,56");
  await alta.getByLabel(/^Categoría/).selectOption({ label: categoria });
  await alta.getByLabel(/^Medio de pago/).selectOption("transferencia");
  await alta.getByLabel(/^Descripción/).fill("Campaña en redes");
  await alta.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Movimiento registrado")).toBeVisible();

  // El día queda elegido y muestra el movimiento
  const delDia = page.getByRole("list", { name: /^Movimientos del / });
  await expect(delDia.getByRole("listitem").filter({ hasText: categoria })).toContainText("− $ 1.234,56");

  // 4) Balance anual: el total de su categoría es exactamente ese egreso
  menu = await menuPanel(page, isMobile);
  await menu.getByRole("link", { name: "Balance anual" }).click();
  const egresosPorCategoria = page.getByRole("region", { name: "Egresos por categoría" });
  await expect(egresosPorCategoria.getByRole("listitem").filter({ hasText: categoria })).toContainText("$ 1.234,56 · ");

  // 5) Exportar el año a Excel
  const descarga = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar a Excel" }).click();
  expect((await descarga).suggestedFilename()).toBe(`caja-${new Date().getFullYear()}.xlsx`);

  // 6) "Volver al panel" regresa al menú general
  menu = await menuPanel(page, isMobile);
  await menu.getByRole("link", { name: "Volver al panel" }).click();
  await expect(page.getByRole("heading", { name: /^Hola, / })).toBeVisible();
  menu = await menuPanel(page, isMobile);
  await expect(menu.getByRole("link", { name: "Caja" })).toBeVisible();
});
