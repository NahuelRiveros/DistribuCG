import { expect, test } from "@playwright/test";
import { ADMIN_E2E, PUERTO_API } from "./config_e2e.js";
import { ingresarComoAdmin } from "./ayudantes.js";

const API = `http://localhost:${PUERTO_API}/api`;

// Crea el producto por API (lo que se prueba acá es el stock, no el alta de productos).
async function crearProducto(request, sufijo) {
  const login = await request.post(`${API}/auth/login`, { data: { email: ADMIN_E2E.email, contrasena: ADMIN_E2E.contrasena } });
  const headers = { Authorization: `Bearer ${(await login.json()).data.token}` };
  const categoria = (await (await request.post(`${API}/catalogo/categorias`, { headers, data: { nombre: `Aceites ${sufijo}` } })).json()).data;
  const producto = await request.post(`${API}/catalogo/productos`, {
    headers,
    data: { categoria_id: categoria.id, nombre: `Aceite ${sufijo}`, variantes: [{ nombre: "900 ml", sku: `ACE-${sufijo}`, precio: 2000 }] },
  });
  expect(producto.ok()).toBeTruthy();
  return (await producto.json()).data;
}

test("ingreso, mínimo y ajuste de stock se reflejan en la tienda", async ({ page, request }, testInfo) => {
  const sufijo = testInfo.project.name;
  const producto = await crearProducto(request, sufijo);
  const disponibilidad = page.getByText(/^(Disponible|Últimas unidades|Sin stock)$/);

  await ingresarComoAdmin(page);

  // Ingreso de mercadería con remito
  await page.goto("/admin/stock/ingreso");
  await page.getByRole("searchbox", { name: "Buscar producto para agregar" }).fill(`ACE-${sufijo}`);
  await page.getByRole("button", { name: new RegExp(`Aceite ${sufijo}`) }).click();
  await page.getByRole("list", { name: "Productos del ingreso" }).getByLabel("Cantidad").fill("5");
  await page.getByLabel("Remito o factura").fill("R-0001-000001");
  await page.getByRole("button", { name: "Registrar ingreso" }).click();
  await expect(page.getByText("Ingreso registrado: 5 unidades en 1 presentación(es)")).toBeVisible();

  // Mínimo 5: con 5 disponibles pasa a "Últimas unidades" en la tienda
  await page.goto(`/admin/stock?q=ACE-${sufijo}`);
  await page.getByRole("button", { name: `Configurar stock de Aceite ${sufijo} · 900 ml` }).click();
  await page.getByLabel("Stock mínimo").fill("5");
  await page.getByRole("dialog").getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Configuración guardada")).toBeVisible();

  await page.goto(`/catalogo/${producto.slug}`);
  await expect(disponibilidad).toHaveText("Últimas unidades");

  // Ajuste: se rompieron las 5 → "Sin stock"
  await page.goto(`/admin/stock?q=ACE-${sufijo}`);
  await page.getByRole("button", { name: `Ajustar stock de Aceite ${sufijo} · 900 ml` }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("radio", { name: "Restar" }).click();
  await dialogo.getByLabel("Cantidad").fill("5");
  await dialogo.getByLabel("Motivo").selectOption("Rotura");
  await dialogo.getByRole("button", { name: "Registrar ajuste" }).click();
  await expect(page.getByText("Stock ajustado: quedan 0")).toBeVisible();

  await page.goto(`/catalogo/${producto.slug}`);
  await expect(disponibilidad).toHaveText("Sin stock");

  // El historial muestra los dos movimientos con su motivo y remito
  await page.goto(`/admin/stock/${producto.variantes[0].id}`);
  // En escritorio es una tabla y en celular tarjetas: se busca dentro de la lista, sea cual sea
  const historial = page.getByLabel("Movimientos de stock");
  await expect(historial.getByText("Rotura")).toBeVisible();
  await expect(historial.getByText(/remito R-0001-000001/)).toBeVisible();
});
