---
name: nuevo-cliente
description: Arma un cliente nuevo de la plantilla (marca, colores, logo, Home, navbar, footer, módulos, reglas de negocio y checklist del .env) de forma guiada, y verifica que quede listo para publicar. Usar cuando se pida "nuevo cliente", "armar la tienda de X" o "configurar otro negocio".
argument-hint: <nombre del negocio, ej. "Ferretería López">
---

# Nuevo cliente: $ARGUMENTS

Un cliente = una carpeta en `frontend/src/clientes/<id>/` + su configuración en `proyecto.config.js`
+ su `servidor/.env`. **Nunca** se tocan componentes para un cliente: si algo no se puede
configurar, se agrega la opción a la plantilla (para todos) y se avisa.

## Reglas
- **No inventar datos del negocio**: dirección, teléfono, email, CUIT, promociones, "envío gratis",
  cantidad de años, clientes, etc. Lo que no se sepa queda `[COMPLETAR …]` y `cliente:verificar` lo marca.
- Textos del Home en español rioplatense, claros, sin promesas que el cliente no confirmó.
- **No leer ni mostrar `servidor/.env`**: solo se le da al usuario la lista de qué completar.
- No modificar `clientes/demo/`: es la plantilla de la que se copian los nuevos.

## Paso 1 — Preguntar (una sola vez, todo junto)
Pedir lo que falte con `AskUserQuestion` o en un mensaje breve:
1. **Nombre comercial**, razón social y rubro (ej. "Ferretería López", "López Hnos. S.R.L.", "Ferretería y corralón").
2. **Frase corta** (tagline). Si no tiene, proponer 2 o 3 opciones según el rubro.
3. **Logo**: ruta del archivo (SVG o PNG con fondo transparente, idealmente cuadrado).
4. **Colores**: principal y de acento en hex, o "sacalos del logo".
5. **Qué vende y cómo**: módulos (catálogo, stock, tienda online, caja), si hace **envío, retiro o ambos**,
   pedido mínimo, y cómo llama a las variantes ("Presentación", "Talle y color", "Medida"…).
6. **Contacto**: dirección, WhatsApp, email, redes (Instagram, Facebook).
7. ¿Los clientes se pueden **registrar solos** en la tienda?
8. **Menú de productos**: ¿un solo link "Productos" (distribuidora, almacén) o **por categorías** con
   desplegables (ropa, calzado, accesorios: Mujer ▾ · Hombre ▾ · Calzado ▾)? ¿Mostrar "Novedades" y "Ofertas"?
   ¿Cómo se llama la sección ("Productos", "Tienda", "Colección")?

## Paso 2 — Crear la carpeta
```bash
npm run cliente:nuevo -- <id> --nombre "<Nombre comercial>" --activar
```
- `<id>`: minúsculas y guiones bajos, sin acentos (`ferreteria_lopez`).
- Copia `clientes/demo`, pone el nombre y deja `[COMPLETAR]` en lo pendiente. `--activar` cambia
  `proyecto.config.js → cliente` para verlo con `npm run dev`.

## Paso 3 — Completar la carpeta del cliente
| Archivo | Qué completar |
|---|---|
| `assets/` | Copiar el logo (ej. `logo.svg`) y actualizar el `import logo` de `marca.js`. Borrar el logo de demo copiado. |
| `marca.js` | nombre, nombre_corto, razon_social, rubro, tagline |
| `tema.js` | `primario`, `primario-hover` (un poco más oscuro), `primario-texto`, `acento`, `fondo`; fuente de títulos si tiene una |
| `home.js` | Secciones (`hero`, `pilares`, `pasos`, `contacto`) con textos del rubro. Iconos: `src/componentes/ui/icono.jsx` |
| `navbar.js` | Links propios (los de catálogo/tienda los agregan los módulos solos); `productos` (nombre de la sección), `menu_productos` (`"enlace"` o `"categorias"`), `novedades`, `ofertas`. Con `"categorias"` conviene `mostrar_rubro: false` y pocos links propios (la barra se llena rápido) |
| `footer.js` | Columnas, contacto real, redes, `legal.titular` |

**Contraste**: `primario-texto` sobre `primario` tiene que leerse (WCAG AA, relación ≥ 4.5:1). Calcularlo;
si no llega, oscurecer el primario o usar texto blanco/negro según corresponda. Mismo control para `acento`
sobre `fondo` (se usa en textos destacados).

## Paso 4 — Configuración del negocio (`proyecto.config.js`)
- `modulos`: prender solo lo contratado (`catalogo`, `stock`, `tienda`, `caja`).
- `catalogo.etiqueta_variante` / `etiqueta_variantes` según el rubro.
- `tienda.modalidades_entrega` (envío / retiro), `tienda.pedido_minimo`, `usuarios.registro_publico`.
- `pagos`: son solo los **valores iniciales**. Los reales (CBU, cuotas, promociones) los carga el
  cliente en el panel → **Configuración**. Si ya los pasó, cargarlos ahí después del primer arranque.

## Paso 5 — Variables de entorno (las carga el usuario en Render y Vercel)
Mostrarle la tabla de `docs/DESPLIEGUE.md` (explicación de cada una en los `.env.example`), **sin leer el `.env`**.
Para cada cliente nuevo cambian sí o sí: `BD_URL_NEON` (o base propia), `BD_ESQUEMA` (ej. `ferreteria_lopez`),
`CLAVE_SESIONES` (nueva, nunca reutilizar), `URL_FRONTEND_VERCEL`, `CLOUDINARY_CARPETA`, `SUPERADMIN_*`, y en
Vercel `VITE_URL_API_RENDER`. Si pega claves reales en el chat, pedirle que las cambie.

## Paso 6 — Verificar
1. `npm run cliente:verificar` → sin ❌ (los ⚠️ de datos EJEMPLO de pagos se resuelven en el panel).
2. `npm run lint` y `npm test`.
3. `npm run test:e2e` (usa el cliente activo).
4. Levantar la tienda y **sacar capturas** del Home en escritorio y celular (Playwright), mirarlas y
   mostrárselas al usuario: logo, colores, textos cortados, contraste.

## Paso 7 — Cierre para el usuario
Resumen con: qué quedó configurado, qué falta (lista de `[COMPLETAR]` si quedó alguno) y lo que el
cliente hace solo en el panel después de publicar:
- Si eligió menú por categorías: **Catálogo → Categorías** → marcar "Mostrar en el menú" y ordenarlas con "Orden".
- **Configuración** → medios de pago (CBU real), cuotas y promociones.
- **Catálogo** → categorías y productos (o importación desde Excel).
- **Sistema → Usuarios** → alta del personal.

Para volver a la demo: `npm run cliente:activar -- demo`.
