# Cómo trabajar con Claude Code en este proyecto

## 1. Mapa de skills

| Grupo | Skill | Cuándo |
|---|---|---|
| Arranque | `/scaffold-proyecto` | Una sola vez, para crear la base |
| Reutilizar | `/traer-de-distribucg <pieza>` | Traer algo que ya funciona en DistribuCG (ver `docs/ORIGEN_DISTRIBUCG.md`) |
| Orquestador | `/feature <descripción>` | Cualquier funcionalidad que toca base + servidor + pantallas |
| Generadores | `/db-model <cambio>` | Tabla, columna, índice o relación nueva (con migración) |
| | `/api-endpoint <MÉTODO ruta — desc>` | Un endpoint con rutas, controlador, servicio y tests |
| | `/react-component <nombre — módulo — desc>` | Componente + hook + test |
| | `/crud-admin <entidad>` | ABM completo de panel admin |
| | `/e2e-test <flujo>` | Flujo crítico de punta a punta |
| Dominio | `dominio-ecommerce` | Catálogo, publicación, carrito, pedidos, cobros |
| | `dominio-inventario` | Stock, movimientos, ajustes, alertas |
| | `auth-rbac` | Login, registro, roles, permisos |
| | `pagos-webhooks` | Mercado Pago (cuando se active `pagos_online`) |
| Calidad | `/security-audit [módulo]` | Antes de publicar y cada tanto |
| | `/perf-audit [módulo]` | Algo lento o antes de publicar |
| | `/pre-pr` | Antes de cada commit importante |
| Subagente | `code-reviewer` | "Usá el subagente code-reviewer para revisar el diff" |

Las skills de dominio se cargan solas cuando la tarea las necesita; también podés nombrarlas ("usando dominio-inventario, ...").

**Crear una skill nueva**: carpeta `.claude/skills/<nombre>/SKILL.md` con `name` y `description` (qué hace y cuándo usarla). Si le repetís lo mismo a la IA tres veces, eso es una skill.

## 2. Ciclo de una funcionalidad

```
Plan → Base de datos → Schemas compartidos → Servidor → Frontend → E2E → Revisión → Commit
```

1. **Plan primero** (modo plan con `Shift+Tab`, o "no escribas código todavía").
2. Una capa por vez, con tests al cerrar cada una.
3. `code-reviewer` + `/pre-pr` al final.
4. Una funcionalidad por conversación; `/clear` al cambiar de tema.

## 3. Plantillas de prompt

### Traer algo de DistribuCG
```
/traer-de-distribucg notas de pedido
Quiero el mismo flujo de estados y cobros parciales, pero que descuente stock
al confirmar el pedido. Mostrame qué vas a copiar, qué vas a cambiar y qué descartás.
```

### Funcionalidad completa
```
/feature Alertas de stock bajo

Contexto: cada variante tiene un stock mínimo.
Requisitos:
- Pantalla admin con variantes en o bajo el mínimo, filtro por categoría.
- Badge con la cantidad de alertas en el navbar admin.
- Solo admin y staff.
Fuera de alcance: avisos por mail.
Criterio de aceptación: test que dispara la alerta después de un pedido.
```

### Solo base de datos
```
/db-model Tabla proveedor (nombre, CUIT único, email, teléfono) y relación opcional
producto → proveedor. Mostrame la migración antes de aplicarla.
```

### Solo servidor
```
/api-endpoint POST /api/stock/ajustes — ajuste manual (admin, staff).
Recibe variante_id, cantidad (con signo) y motivo obligatorio.
Tiene que usar stock_servicio.registrarMovimiento y dar 409 si deja stock negativo.
```

### Solo pantalla
```
/react-component ajuste_stock_modal — stock — modal para POST /api/stock/ajustes
(schema en compartido/schemas/stock.js). Se abre desde la tabla de stock y la refresca al guardar.
```

### Cliente nuevo (Home, navbar, footer)
```
Nuevo cliente "ferreteria_sur": copiá frontend/src/clientes/demo a clientes/ferreteria_sur,
con nombre "Ferretería Sur", colores naranja y gris, Home con 3 pilares
(asesoramiento, envíos, precios mayoristas) y WhatsApp 11-1234-5678.
Activalo en proyecto.config.js con módulos catalogo + stock + tienda.
```

### Bug
```
Bug: si dos clientes piden la última unidad al mismo tiempo, se crean los dos pedidos.
Primero escribí un test que lo reproduzca y mostrame que falla; después arreglalo.
```

## 4. Reglas de oro para pedirle cosas a la IA

- **Qué + por qué + cómo sé que está bien + qué queda afuera.** Lo que no digas, la IA lo inventa.
- Nombrá archivos o pantallas existentes para reutilizar ("igual que en DistribuCG").
- Para bugs: primero un test que falle.
- Pedí que muestre la salida real de los comandos, no "debería funcionar".
- Reglas de negocio (IVA, precios, cuándo se descuenta stock) las definís vos.
- Si la IA se equivoca dos veces en lo mismo, sumá la regla a `CLAUDE.md` o a la skill correspondiente.

## 5. Hoja de ruta

| Paso | Qué | Skills |
|---|---|---|
| 1 ✅ | Configuración para la IA: `CLAUDE.md`, skills, inventario de DistribuCG | — |
| 2 ✅ | Base del proyecto + núcleo (errores, validación, auth, migraciones) + cliente demo con Home/navbar/footer configurables | `/scaffold-proyecto`, `/traer-de-distribucg` |
| 3 ✅ | Catálogo: API, panel `/admin` con menú lateral, tienda `/catalogo`, imágenes, importación Excel y ajuste masivo de precios | `/feature`, `/crud-admin`, `/traer-de-distribucg` |
| 4 ✅ | Stock: movimientos inmutables, sin sobreventa, ingresos, ajustes, mínimos, columna Stock en la importación y disponibilidad en la tienda | `/feature` + `dominio-inventario` |
| 5 ✅ | Tienda: registro, carrito (con y sin cuenta), envío del pedido con reserva de stock, estados, cobros, mis pedidos y panel de pedidos | `/feature` + `dominio-ecommerce` |
| 6 ✅ | Skill `/nuevo-cliente` + `npm run cliente:nuevo / verificar / activar` (plantilla = `clientes/demo`) | `/nuevo-cliente` |
| 7 | Seguridad, rendimiento y deploy (Render + Neon) | `/security-audit`, `/perf-audit` |
| 8 | Opcional: pagos online | `pagos-webhooks` |
