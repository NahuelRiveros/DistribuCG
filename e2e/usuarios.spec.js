import { expect, test } from "@playwright/test";
import { ingresarComoAdmin } from "./ayudantes.js";

test("el admin da de alta personal, que entra al panel sin ver Usuarios, y al desactivarlo pierde el acceso", async ({ page, browser }, testInfo) => {
  const email = `staff-${testInfo.project.name}-${Date.now()}@local.test`;
  const clave = "clave-staff-123";

  // 1) Admin: alta desde Sistema → Usuarios
  await ingresarComoAdmin(page);
  await page.goto("/admin/usuarios");
  await page.getByRole("button", { name: "Nuevo usuario" }).click();
  const alta = page.getByRole("dialog", { name: "Nuevo usuario" });
  await expect(alta.getByLabel(/^Rol/).locator("option")).toHaveText(["Personal", "Cliente"]); // un admin no crea admins
  await alta.getByLabel(/^Nombre/).fill("Lucía");
  await alta.getByLabel(/^Apellido/).fill("Gómez");
  await alta.getByLabel(/^Email/).fill(email);
  await alta.getByLabel(/^Contraseña inicial/).fill(clave);
  await alta.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByText("Usuario creado")).toBeVisible();

  // 2) La persona nueva entra, en otro navegador: ve el panel pero no la sección Usuarios
  const contextoStaff = await browser.newContext(testInfo.project.use);
  const staff = await contextoStaff.newPage();
  await staff.goto("/login?volver=%2Fadmin");
  await staff.getByLabel("Email").fill(email);
  await staff.locator("input[name=contrasena]").fill(clave);
  await staff.getByRole("button", { name: "Ingresar" }).click();
  await expect(staff.getByRole("heading", { name: "Hola, Lucía" })).toBeVisible();
  await expect(staff.locator('a[href="/admin/usuarios"]')).toHaveCount(0);
  await staff.goto("/admin/usuarios");
  await expect(staff).toHaveURL(/\/$/); // sin permiso vuelve a la tienda

  // 3) Admin la desactiva (con confirmación)
  // Por email: escritorio y celular corren a la vez y cada uno crea su "Lucía"
  const suFila = page.locator("tr, li").filter({ hasText: email });
  await suFila.getByRole("button", { name: "Desactivar a Lucía" }).click();
  await page.getByRole("dialog", { name: "¿Desactivar a Lucía?" }).getByRole("button", { name: "Desactivar" }).click();
  await expect(page.getByText("Lucía ya no puede ingresar")).toBeVisible();

  // 4) Su sesión deja de valer: al volver al panel le pide ingresar
  await staff.goto("/admin");
  await expect(staff).toHaveURL(/\/login/);
  await contextoStaff.close();
});
