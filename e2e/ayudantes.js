import { expect } from "@playwright/test";
import { ADMIN_E2E } from "./config_e2e.js";

export async function ingresarComoAdmin(page) {
  await page.goto("/login?volver=%2Fadmin");
  await page.getByLabel("Email").fill(ADMIN_E2E.email);
  await page.locator("input[name=contrasena]").fill(ADMIN_E2E.contrasena);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: `Hola, ${ADMIN_E2E.nombre}` })).toBeVisible();
}
