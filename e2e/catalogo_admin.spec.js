import { expect, test } from "@playwright/test";
import { ingresarComoAdmin } from "./ayudantes.js";

test("el admin carga una categoría y un producto y el producto aparece publicado en la tienda", async ({ page }, testInfo) => {
  // Nombres distintos por proyecto (escritorio / celular): corren en paralelo sobre la misma base.
  const categoria = `Bebidas ${testInfo.project.name}`;
  const producto = `Agua mineral ${testInfo.project.name}`;

  await ingresarComoAdmin(page);

  // Categoría
  await page.goto("/admin/catalogo/categorias");
  await page.getByRole("button", { name: "Nueva categoría" }).click();
  const dialogo = page.getByRole("dialog", { name: "Nueva categoría" });
  await dialogo.getByLabel("Nombre").fill(categoria);
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Categoría creada")).toBeVisible();
  await expect(page.getByRole("list", { name: "Árbol de categorías" }).getByText(categoria)).toBeVisible();

  // Producto con una presentación
  await page.goto("/admin/catalogo/productos/nuevo");
  const datos = page.locator("section").filter({ has: page.getByRole("heading", { name: "Datos del producto" }) });
  await datos.getByLabel("Nombre").fill(producto);
  await datos.getByLabel("Categoría").selectOption({ label: categoria });
  const presentacion = page.getByRole("listitem", { name: "Presentación 1" });
  await presentacion.getByLabel("Nombre").fill("500 ml");
  await presentacion.getByLabel("Precio neto").fill("1000");
  await page.getByRole("button", { name: "Guardar producto" }).click();

  // Queda en la edición del producto, lista para cargarle imágenes
  await expect(page.getByText("Producto creado. Ahora podés agregarle imágenes.")).toBeVisible();
  await expect(page.getByRole("heading", { name: `Editar ${producto}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Imágenes" })).toBeVisible();

  await page.goto("/admin/catalogo/productos");
  // En escritorio es una tabla y en celular tarjetas: se busca dentro de la lista, sea cual sea
  await expect(page.getByLabel("Productos", { exact: true }).getByText(producto, { exact: true })).toBeVisible();

  // En la tienda, con IVA
  await page.goto(`/catalogo?q=${encodeURIComponent(producto)}`);
  const tarjeta = page.getByRole("link", { name: new RegExp(producto) });
  await expect(tarjeta).toBeVisible();
  await expect(tarjeta).toContainText("1.210,00");

  await tarjeta.click();
  await expect(page.getByRole("heading", { level: 1, name: producto })).toBeVisible();
});

test("un visitante no puede entrar al panel", async ({ page }) => {
  await page.goto("/admin/catalogo/productos");
  await expect(page).toHaveURL(/\/login\?volver=/);
});
