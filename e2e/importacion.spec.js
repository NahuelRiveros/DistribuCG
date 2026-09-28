import { expect, test } from "@playwright/test";
import { ingresarComoAdmin } from "./ayudantes.js";

test("el admin importa una lista de precios en CSV y los productos aparecen en la tienda", async ({ page }, testInfo) => {
  // Códigos y nombres distintos por proyecto: escritorio y celular corren en paralelo sobre la misma base.
  const p = testInfo.project.name;
  const csv = [
    "Código;Producto;Presentación;Categoría;Precio;IVA",
    `YER-${p}-1;Yerba ${p};500 g;Almacén ${p} > Infusiones;1.000,00;21`,
    `YER-${p}-2;Yerba ${p};1 kg;Almacén ${p} > Infusiones;1.800,00;21`,
    `MAL-${p};Fila con error ${p};;Almacén ${p};sin precio;21`,
  ].join("\n");

  await ingresarComoAdmin(page);
  await page.goto("/admin/catalogo/importar");

  // Paso 1: archivo
  await page.getByLabel("Archivo a importar").setInputFiles({ name: `lista-${p}.csv`, mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByRole("button", { name: "Leer archivo" }).click();

  // Paso 2: las columnas se reconocen solas por sus títulos
  await expect(page.getByText("3 filas encontradas.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Revisar sin cargar nada" }).click();

  // Paso 3: revisión y carga
  await expect(page.getByRole("heading", { name: "3. Revisá y confirmá" })).toBeVisible();
  await page.getByLabel(/Importar solo las filas correctas/).check();
  await page.getByRole("button", { name: "Confirmar e importar" }).click();
  await expect(page.getByText("Listo. Productos nuevos: 1 · Categorías nuevas: 2.")).toBeVisible();

  // En la tienda, con el precio con IVA y sus dos presentaciones
  await page.goto(`/catalogo?q=${encodeURIComponent(`Yerba ${p}`)}`);
  const tarjeta = page.getByRole("link", { name: new RegExp(`Yerba ${p}`) });
  await expect(tarjeta).toContainText("Desde");
  await expect(tarjeta).toContainText("1.210,00");
});
