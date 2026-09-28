import { expect, test } from "@playwright/test";
import { ADMIN_E2E, PUERTO_API } from "./config_e2e.js";
import { ingresarComoAdmin } from "./ayudantes.js";

const API = `http://localhost:${PUERTO_API}/api`;

async function menuPanel(page, isMobile) {
  if (isMobile) await page.getByRole("button", { name: "Abrir menú del panel" }).click();
  return page.getByRole("navigation", { name: "Panel" }).locator("visible=true");
}

test("Configuración: rechaza un CBU mal tipeado, guarda una promoción y la ficha la muestra al momento", async ({ page, request, isMobile }) => {
  await ingresarComoAdmin(page);
  await (await menuPanel(page, isMobile)).getByRole("link", { name: "Configuración" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Medios de pago" })).toBeVisible();
  const menu = await menuPanel(page, isMobile);
  await expect(menu.getByRole("link", { name: "Cuotas" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Promociones" })).toBeVisible();

  // La configuración es una sola para todo el sitio: solo una de las dos corridas (escritorio) la modifica
  test.skip(isMobile, "En celular solo se verifica que la pantalla se abre");

  // 1) Un CBU con un número mal tipeado no se puede guardar (el CBU está dentro de "Editar" de Transferencia)
  await page.getByRole("button", { name: /^Editar Transferencia/ }).click();
  const cbu = page.getByLabel(/^CBU/);
  const cbuOriginal = await cbu.inputValue();
  await cbu.fill("2850590940090418135202");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("El CBU no es válido: revisá los 22 números (tiene dígitos de control)")).toBeVisible();
  await cbu.fill(cbuOriginal);

  // 2) Pestaña Promociones: nueva promoción + cinta propia
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Promociones" }).click();
  const promos = page.getByRole("region", { name: "Promociones bancarias" });
  await promos.getByRole("button", { name: "Agregar promoción" }).click();
  await promos.getByLabel(/^Banco/).last().fill("Banco E2E");
  await promos.getByLabel(/^Beneficio/).last().fill("25% de reintegro con débito");
  await page.getByRole("checkbox", { name: "Usar un texto propio" }).check();
  await page.getByLabel(/^Texto de la cinta/).fill("¡Promo E2E: 25% de reintegro!");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados. La tienda ya los muestra.")).toBeVisible();
  await expect(page.getByText(/Último cambio: Admin E2E/)).toBeVisible();

  // 3) La ficha de un producto ya lo muestra
  const login = await request.post(`${API}/auth/login`, { data: { email: ADMIN_E2E.email, contrasena: ADMIN_E2E.contrasena } });
  const headers = { Authorization: `Bearer ${(await login.json()).data.token}` };
  const categoria = (await (await request.post(`${API}/catalogo/categorias`, { headers, data: { nombre: "Config E2E" } })).json()).data;
  const producto = (
    await (await request.post(`${API}/catalogo/productos`, { headers, data: { categoria_id: categoria.id, nombre: "Tostadora E2E", variantes: [{ nombre: "Única", sku: "TOS-E2E", precio: 5000 }] } })).json()
  ).data;
  await page.goto(`/catalogo/${producto.slug}`);
  await expect(page.getByText("¡Promo E2E: 25% de reintegro!")).toBeVisible();
  await expect(page.getByRole("region", { name: "Medios de pago y financiación" }).getByText("25% de reintegro con débito")).toBeVisible();
});
