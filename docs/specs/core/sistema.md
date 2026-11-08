# Módulo: sistema (`SIS`)

## Objetivo

Lo que sostiene cualquier instalación, sea del rubro que sea: el cobro mensual del software al
cliente, qué módulos tiene habilitados, el contenido editable de la portada y un servidor que
arranca y responde de forma segura.

## Alcance

- **Incluye:** la suscripción del software (MercadoPago), los módulos habilitados por el super admin,
  el contenido del home, la cinta de anuncios, la subida de imágenes y el comportamiento del servidor
  (salud, CORS, variables de entorno, diagnóstico del super admin).
- **No incluye:** quién entra a cada pantalla ([permisos.md](permisos.md), [panel.md](panel.md)).

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Dueño del software (vos) | Cobrar la suscripción, extenderla o fijarla, también sin ingresar (con la clave secreta). |
| Super admin | Ver y ajustar la suscripción; prender y apagar módulos. |
| Admin | Ver el estado de la suscripción, sus avisos y pagarla. |
| Rol con "Editar el home" | Contenido del home, cinta de anuncios e imágenes. |
| Visitante | Ver el home y la cinta de anuncios. |

## Reglas

### Suscripción del software

| Código | Regla | Estado |
| --- | --- | --- |
| SIS-01 | Cada instalación tiene una suscripción con fecha de vencimiento. Su estado es: **activo** (faltan más de 10 días), **aviso** (faltan de 1 a 10), **gracia** (venció hace 10 días o menos) o **vencido** (más de 10). | ✅ `ux_rules.test.mjs` › "SIS-01: 10 días de gracia después del vencimiento…" |
| SIS-02 | Desde "aviso", el admin ve en el panel una franja con el estado y un acceso para pagar. | ⚠️ sin test |
| SIS-03 | El admin paga con MercadoPago el precio mensual configurado. Un pago aprobado extiende la suscripción 30 días; antes de extender, el servidor confirma el pago consultando a MercadoPago (no le cree al aviso que llega). | ⚠️ sin test |
| SIS-04 | Un mismo pago extiende la suscripción una sola vez, aunque MercadoPago avise varias veces. | ✅ `checkout.integration.mjs` › "SIS-04: el mismo pago avisado varias veces por MercadoPago extiende la suscripción una sola vez" |
| SIS-05 | Con el plan vencido, el personal (admin incluido) no puede crear ni modificar nada desde el panel, con el aviso "Plan vencido. Renovalo para registrar nuevos datos."; sí puede ver, ingresar y pagar. La tienda sigue funcionando para los clientes y los visitantes. El super admin nunca se bloquea. | ✅ `ux_rules.test.mjs` › "SIS-05: con el plan vencido se bloquea al personal…" |
| SIS-06 | Si no se puede consultar el estado de la suscripción, no se bloquea nada: un problema técnico no frena el negocio. | ⚠️ sin test |
| SIS-07 | El estado se consulta como mucho cada 5 minutos, para no despertar la base en cada pedido. | ⚠️ sin test |
| SIS-08 | El super admin ve el estado y el historial de pagos, extiende días o fija una fecha. El dueño del software puede hacer lo mismo sin ingresar, con la clave secreta del servidor. | ⚠️ sin test |

### Módulos habilitados

| Código | Regla | Estado |
| --- | --- | --- |
| SIS-20 | El super admin prende y apaga cada módulo de negocio (hoy, Distribuidora) desde "Módulos habilitados", sin volver a desplegar. Apagado, sus pantallas desaparecen del menú y su API responde "Este módulo no está habilitado para esta cuenta". | ✅ `ux_rules.test.mjs` › "navbar filtra árboles por rol y módulo…" (la respuesta de la API: ⚠️) |
| SIS-21 | Hay dos llaves distintas: `gate_config.js` decide qué módulos **existen** en la instalación (código y tablas); "Módulos habilitados" decide cuáles están **prendidos** en este momento. | ✅ mismo test que SIS-20 |
| SIS-22 | Un módulo que no figura en la lista de habilitados no se bloquea: solo se bloquea lo que se apagó a propósito. | ⚠️ sin test |

### Contenido de la portada

| Código | Regla | Estado |
| --- | --- | --- |
| SIS-30 | El home muestra imágenes y videos por área, en carrusel o en grilla según se elija para cada área. Cualquiera los ve; los carga quien tiene "Editar el home". | ⚠️ sin test |
| SIS-31 | Sin contenido cargado, el home muestra los textos por defecto de la configuración del cliente y oculta las secciones vacías. | ✅ `storefront.spec.js` › "home comercial: sin ofertas ni productos mantiene navegación y contacto" |
| SIS-32 | La cinta de anuncios se ve para todos; la crea, edita, activa o borra quien tiene "Editar el home". | ⚠️ sin test |
| SIS-33 | Subir o borrar imágenes (a Cloudinary) lo puede hacer quien tiene "Editar el home" o "Editar artículos". | ⚠️ sin test |

### Servidor y despliegue

| Código | Regla | Estado |
| --- | --- | --- |
| SIS-40 | `/api/health` responde sin consultar la base, para que el chequeo de Render no la despierte; con `?bd=1` sí la revisa. | ✅ `despliegue.test.mjs` › "/api/health responde sin tocar la base" |
| SIS-41 | La API solo acepta pedidos desde la tienda configurada (aunque tenga "/" al final); otros orígenes reciben 403. | ✅ `despliegue.test.mjs` › "CORS acepta la tienda configurada…" |
| SIS-42 | Las variables pegadas en Render con comillas o espacios se limpian solas. | ✅ `despliegue.test.mjs` › "variables pegadas con comillas o espacios en Render se limpian" |
| SIS-43 | Si la dirección de la base está incompleta, el servidor no arranca y explica qué falta, sin mostrar el valor. | ✅ `despliegue.test.mjs` › "BD_URL con solo el host frena el arranque…" |
| SIS-44 | El revisor de `.env` avisa nombres viejos y valores de ejemplo, sin mostrar ningún valor. | ✅ `despliegue.test.mjs` › "verificar_env avisa nombres viejos y valores de ejemplo…" |
| SIS-45 | En producción, la web usa la API de DistribuCG y rechaza el dominio anterior antes de mandar credenciales. | ✅ `despliegue.test.mjs` › "la API de producción usa DistribuCG…"; "producción permite el frontend de DistribuCG…" |
| SIS-46 | El diagnóstico del super admin detecta credenciales, email, documento y estados que impiden ingresar, sin devolver nunca la contraseña ni su hash. | ✅ `super_admin.test.mjs` (4 tests "diagnóstico admin: …") |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Precio mensual del software | variable `SOFTWARE_PRECIO` del servidor | `[COMPLETAR: confirmar en Render]` |
| Días de aviso y de gracia | `services/sistema/software_suscripcion_service.js` | 10 de aviso · 10 de gracia |
| Cada cuánto se revisa la suscripción | `middleware/suscripcion_middleware.js` | 5 minutos |
| Clave secreta del dueño del software | variable `SEED_SECRET` (header `x-seed-token`) | — |
| Qué módulos existen | `gate_config.js` | Distribuidora |

## Dónde está el código

- Servidor: suscripción en `routes/sistema/suscripcion_router.js` → `controllers/sistema/suscripcion_controller.js` →
  `services/sistema/software_suscripcion_service.js` y `mercadopago_service.js`, bloqueo en
  `middleware/suscripcion_middleware.js`; módulos en `routes/sistema/modulos_router.js` y
  `middleware/modulo_middleware.js`; contenido en `routes/home/`, `routes/sistema/banner_anuncio_router.js` y
  `routes/upload_router.js`; salud y CORS en `app.js` y `routes/index.js`.
- Frontend: `controls/suscripcion/suscripcion_banner.jsx`, `modules/usuarios/admin/suscripcion_page.jsx`,
  `modules/usuarios/super_admin/` (suscripción y módulos), `modules/usuarios/admin/` (home y anuncios).

## Mejoras técnicas detectadas

- **Módulos habilitados sin caché:** cada pedido a la API de la distribuidora consulta la base para saber si
  el módulo está prendido. Con Neon o Supabase gratis eso suma consultas que no hacen falta: conviene
  guardarlo en memoria unos minutos, como ya se hace con la suscripción.

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-11-08 | SIS-05 | Con el plan vencido se bloquea el panel (el equipo no carga ni modifica nada, salvo pagar) y la tienda sigue vendiendo, para no cortarle las ventas al negocio. Se descartaron bloquear todo y no bloquear nunca. | Dueño del proyecto |
| 2026-11-08 | SIS-01 | 10 días de gracia: se cobra a mes vencido y el cliente paga en los primeros días del mes. | Dueño del proyecto |
| 2026-11-08 | SIS-04 | Arreglar el pago duplicado en la misma spec de cambio que SIS-05. | Dueño del proyecto |

## Preguntas abiertas

Ninguna.
