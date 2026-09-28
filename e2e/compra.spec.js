import { expect, test } from "@playwright/test";
import { ADMIN_E2E, PUERTO_API } from "./config_e2e.js";
import { ingresarComoAdmin } from "./ayudantes.js";
import { proyecto } from "../compartido/proyecto.js";
import { medioPorValor, totalConMedio } from "../compartido/reglas/pagos.js";

const pesos = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n).replace(/s/g, " ");

const API = `http://localhost:${PUERTO_API}/api`;

async function tokenAdmin(request) {
  const login = await request.post(`${API}/auth/login`, { data: { email: ADMIN_E2E.email, contrasena: ADMIN_E2E.contrasena } });
  return { Authorization: `Bearer ${(await login.json()).data.token}` };
}

// Producto con 10 unidades en stock, creado por API (acá se prueba la compra, no el alta).
async function productoConStock(request, sufijo) {
  const headers = await tokenAdmin(request);
  const categoria = (await (await request.post(`${API}/catalogo/categorias`, { headers, data: { nombre: `Infusiones ${sufijo}` } })).json()).data;
  const producto = (
    await (
      await request.post(`${API}/catalogo/productos`, {
        headers,
        data: { categoria_id: categoria.id, nombre: `Mate cocido ${sufijo}`, variantes: [{ nombre: "x 25", sku: `MAT-${sufijo}`, precio: 1000 }] },
      })
    ).json()
  ).data;
  await request.post(`${API}/stock/ingresos`, { headers, data: { items: [{ variante_id: producto.variantes[0].id, cantidad: 10 }] } });
  return { producto, headers };
}

test("un visitante compra, el admin prepara y cobra, y el stock baja", async ({ page, browser, request }, testInfo) => {
  const sufijo = testInfo.project.name;
  const { producto, headers } = await productoConStock(request, sufijo);
  const email = `cliente-${sufijo}-${Date.now()}@local.test`;

  // 1) Visitante: agrega 3 al pedido sin tener cuenta
  await page.goto(`/catalogo/${producto.slug}`);
  await page.getByRole("button", { name: "Sumar uno" }).click();
  await page.getByRole("button", { name: "Sumar uno" }).click();
  await page.getByRole("button", { name: "Agregar al pedido" }).click();
  await expect(page.getByText("Agregado al pedido (3)")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mi pedido: 1 producto(s)" })).toBeVisible();

  // 2) Carrito → pide cuenta → se registra (el carrito armado no se pierde)
  await page.goto("/carrito");
  await expect(page.getByTestId("total")).toContainText("3.630,00");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("link", { name: "Creala acá" }).click();
  await page.getByLabel("Nombre").first().fill("Cliente E2E");
  await page.getByLabel("Email").fill(email);
  await page.locator("input[name=contrasena]").fill("clave-segura-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // 3) Datos de entrega y envío
  await expect(page).toHaveURL(/\/pedido\/confirmar/);
  await page.getByLabel("Teléfono").fill("387 555 1234");
  await page.getByLabel("Dirección").fill("Belgrano 123");
  await page.getByLabel("Localidad").fill("Salta");
  await page.getByLabel("Provincia").selectOption("Salta");
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page.getByRole("list", { name: "Productos a enviar" })).toContainText(`3 × Mate cocido ${sufijo}`);
  // Paga por transferencia: el resumen ya muestra el descuento que después cobra el servidor
  const transferencia = medioPorValor("transferencia");
  const conMedio = totalConMedio(3630, "transferencia");
  await page.getByRole("radio", { name: new RegExp(`^${transferencia.etiqueta}`) }).check({ force: true });
  await expect(page.getByTestId("total")).toHaveText(pesos(conMedio.total), { useInnerText: true });
  await page.getByRole("button", { name: "Enviar pedido" }).click();

  await expect(page).toHaveURL(/\/mis-pedidos\/\d+$/);
  const pedidoId = page.url().split("/").pop();
  await expect(page.getByText("Recibido", { exact: true }).first()).toBeVisible();
  // Mientras falta pagar, el cliente ve a dónde transferir
  const datosTransferencia = page.getByRole("region", { name: /^Transferí / });
  if (proyecto.pagos.datos_transferencia?.cbu) await expect(datosTransferencia).toContainText(proyecto.pagos.datos_transferencia.cbu);

  // Al recibirlo, el stock queda reservado (no disponible para otros)
  const existencia = async () => (await (await request.get(`${API}/stock/variantes/${producto.variantes[0].id}/movimientos`, { headers })).json()).existencia;
  expect(await existencia()).toMatchObject({ cantidad: 10, reservado: 3, disponible: 7 });

  // 4) Admin, en otra sesión: pasa a "En preparación" y registra el cobro completo
  const contextoAdmin = await browser.newContext(testInfo.project.use);
  const admin = await contextoAdmin.newPage();
  await ingresarComoAdmin(admin);
  await admin.goto(`/admin/pedidos/${pedidoId}`);
  await admin.getByRole("button", { name: "Pasar a “En preparación”" }).click();
  await expect(admin.getByText("En preparación", { exact: true }).first()).toBeVisible();
  await admin.getByLabel("Medio").selectOption("transferencia");
  await admin.getByRole("button", { name: "Registrar cobro" }).click();
  await expect(admin.getByText("El pedido está cobrado completo.")).toBeVisible();
  await contextoAdmin.close();

  // Al preparar se descuenta lo reservado
  expect(await existencia()).toMatchObject({ cantidad: 7, reservado: 0, disponible: 7 });

  // 5) El cliente ve el pedido actualizado
  await page.reload();
  await expect(page.getByText("En preparación", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Cobrado", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("saldo")).toContainText("0,00");
  await expect(datosTransferencia).toHaveCount(0); // ya pagó: no se muestra más el CBU
});
