---
name: dominio-inventario
description: Reglas de negocio para el control de stock — stock por presentación, movimientos (kardex) inmutables, reservas para pedidos, ajustes con motivo, ingresos de mercadería, alertas de mínimo, importación de cantidades y concurrencia. Usar en cualquier cambio que afecte cantidades de stock (incluidos pedidos).
---

# Dominio stock (módulo `stock`)

En DistribuCG había tres sistemas de stock distintos y el de la distribuidora no tenía historial. Acá hay **uno solo**, ya implementado en `servidor/src/modulos/stock/`.

## Modelo (migración `2026_09_25_1500_crear_stock.js`)
- `variante.controla_stock`: si es `false`, no se controla stock (lo maneja el negocio por fuera): se vende sin límite y no hay movimientos.
- `stock`: una fila por presentación (`variante_id` único), `cantidad`, `reservado`, `minimo`. `CHECK (cantidad >= 0 AND reservado >= 0 AND reservado <= cantidad)`. **Disponible = cantidad − reservado.** Un solo depósito (varios: migración futura).
- `movimiento_stock`: **solo INSERT** (un trigger rechaza UPDATE y DELETE). Cada fila guarda el cambio en `cantidad` (±) y en `reservado` (±), los saldos resultantes, `motivo`, `costo_unitario`, `referencia_tipo`/`referencia_id` y `usuario_id`.

## La única puerta: `movimientos.js`
```js
import { registrarMovimiento, registrarMovimientos } from "../stock/movimientos.js";

await sequelize.transaction(async (transaction) => {
  // un pedido: reservar al enviarlo…
  await registrarMovimientos(items.map((i) => ({ variante_id: i.variante_id, tipo: "reserva", reservado: i.cantidad, referencia_tipo: "pedido", referencia_id: pedido.id })), { transaction });
});
```
| Tipo | cantidad | reservado | Uso |
|---|---|---|---|
| `ingreso` | + | 0 | mercadería que entra |
| `ajuste` | ± | 0 | con motivo obligatorio |
| `importacion` | ± | 0 | diferencia al importar Excel |
| `reserva` | 0 | + | pedido enviado, sin descontar todavía |
| `liberacion` | 0 | − | pedido cancelado antes de descontar |
| `venta` | − | 0 ó −igual | venta directa, o de lo reservado (baja las dos cosas) |
| `devolucion` | + | 0 | pedido cancelado después de descontar |

- El saldo se actualiza con una condición atómica (`… WHERE cantidad + Δ >= 0 AND reservado + Δr <= cantidad + Δ`): **sin sobreventa**, probado con 5 ventas simultáneas.
- `registrarMovimientos()` ordena por `variante_id` (evita deadlocks). Si uno falla, falla toda la transacción.
- Error de stock → `Conflicto` con código `STOCK_INSUFICIENTE` y mensaje "No hay stock suficiente de X: hay N disponible(s)."
- Nadie hace `update` de cantidades por fuera (tampoco la importación ni el formulario de producto).

## Reglas de negocio
1. **Cuándo se descuenta un pedido**: `proyecto.config.js → stock.descontar_en` (`envio_pedido` | `confirmacion` | `entrega`). Antes de descontar, reservar. Si se cancela: `liberacion` (si solo estaba reservado) o `devolucion` (si ya se había descontado), **una sola vez** (buscar por `referencia`).
2. Ingreso de mercadería: si la presentación no controlaba stock, se activa.
3. No se puede dejar de controlar stock con reservas pendientes.
4. Stock bajo: disponible ≤ mínimo. Tienda: "Disponible / Últimas unidades / Sin stock" (cantidades solo si `mostrar_cantidad_en_tienda`); `ocultar_sin_stock` saca los agotados del listado.
5. Conciliación: `GET /api/stock/conciliacion` → la suma de movimientos da el saldo.

## Tests obligatorios para cambios de stock
- Concurrencia por la última unidad (`Promise.allSettled`), solo una operación gana.
- Conciliación correcta después de la operación.
- Cancelar un pedido devuelve o libera exactamente una vez.
- Presentación con `controla_stock: false` nunca bloquea ni genera movimientos.
