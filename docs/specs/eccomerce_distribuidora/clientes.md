# Módulo: datos del cliente (`CLI`)

## Objetivo

Tener de cada cliente los datos justos para entregarle, facturarle y cobrarle el precio de su zona,
pedidos una sola vez y validados para que no haya que corregirlos después.

## Alcance

- **Incluye:** "Mis datos" (`/perfil`): nombre, celular, condición frente al IVA, CUIT o DNI, razón social,
  dirección, provincia, departamento, localidad y código postal; las listas de provincias y localidades;
  los datos fiscales de la distribuidora (emisor).
- **No incluye:** la cuenta y la contraseña ([../core/usuarios.md](../core/usuarios.md)), qué lista de
  precios corresponde a cada localidad ([precios.md](precios.md)) ni la factura en sí (PED-60, PED-61).

## Actores

| Quién | Qué puede hacer acá |
| --- | --- |
| Cliente | Ver y cambiar sus propios datos. |
| Personal que hace su propio pedido | Lo mismo: "Mis datos" es siempre de quien ingresó. |
| Equipo con "Ver pedidos" | Ver los datos que quedaron guardados en cada pedido. |
| Equipo con "Ver clientes" | Ver el listado de clientes con datos completos (CLI-11 a CLI-14). |

## Reglas

| Código | Regla | Estado |
| --- | --- | --- |
| CLI-01 | Cada uno ve y cambia solo sus propios datos: no hay forma de pedir o guardar los de otra persona. | ⚠️ sin test |
| CLI-02 | Se piden nombre y apellido (hasta 100 caracteres cada uno) y un celular válido con código de área (ej: 11 2345-6789). | ✅ `ux_rules.test.mjs` › "primer pedido exige nombre, apellido, celular, datos fiscales y de entrega" |
| CLI-03 | La condición frente al IVA es obligatoria: Responsable Inscripto, Monotributista o Exento piden CUIT; Consumidor Final acepta CUIT o DNI. | ✅ `ux_rules.test.mjs` › "fiscal: CUIT con dígito verificador, DNI y factura que corresponde según emisor y cliente" |
| CLI-04 | El CUIT se valida con su dígito verificador y el DNI tiene 7 u 8 números. | ✅ mismo test que CLI-03 |
| CLI-05 | Para entregar se piden dirección, provincia y localidad; departamento, código postal y razón social (hasta 150 caracteres) son opcionales. | ✅ `ux_rules.test.mjs` › mismo test que CLI-02 |
| CLI-06 | Provincia, departamento y localidad se eligen de listas fijas: no se escriben a mano. | ⚠️ sin test |
| CLI-07 | La localidad elegida decide la lista de precios del cliente (PRE-10): cambiar la localidad cambia los precios que ve y paga desde ese momento. | ✅ `checkout.integration.mjs` › "listas de precios: la localidad del cliente define el precio del carrito y del pedido…" |
| CLI-08 | Los datos se piden recién al enviar el primer pedido, no al registrarse. Si a un cliente de antes le falta algo (por ejemplo, la condición frente al IVA), lo completa al pedir sin perder el carrito. | ✅ `checkout.integration.mjs` › "cliente de antes sin condición de IVA: completa sus datos fiscales al pedir y no pierde el carrito"; "sin apellido (cuenta de Google)…" |
| CLI-09 | Cada pedido guarda una copia de los datos del momento: cambiar "Mis datos" no modifica pedidos ya enviados (PED-04). | ⚠️ sin test |
| CLI-10 | La factura sugerida (A, B o C) sale de la condición frente al IVA de la distribuidora y la del cliente. | ✅ mismo test que CLI-03 · ❓ ver pregunta 1 |
| CLI-11 | En el panel hay un listado "Clientes" con los clientes que tienen los datos completos (los mismos que pide el primer pedido, CLI-02 a CLI-05): contacto, condición frente al IVA y documento, dirección y, si los tienen, razón social y email. Los de datos incompletos no aparecen. | ✅ `checkout.integration.mjs` › "CLI-11 a CLI-14: listado de clientes…"; `storefront.spec.js` › "CLI-11 a CLI-13: …" y "CLI-11: sin clientes con datos completos, lo explica" |
| CLI-12 | Se busca por nombre, apellido, razón social, CUIT/DNI (con o sin guiones o puntos) o email, y se filtra por localidad. Muestra hasta 50 por página. | ✅ mismos tests que CLI-11 |
| CLI-13 | Cada cliente muestra cuántos pedidos hizo y, a quien tiene "Ver pedidos", un enlace a sus pedidos (la gestión de notas filtrada por ese cliente, con "Ver todos los pedidos" para quitar el filtro). | ✅ mismos tests que CLI-11 |
| CLI-14 | Ver el listado pide el permiso propio "Ver clientes" (`clientes.ver`), que el servidor controla. De entrada solo lo tienen admin y super admin; al resto se le tilda en Roles y permisos. | ✅ `checkout.integration.mjs` (403 sin el permiso); `ux_rules.test.mjs` › "CLI-14: …"; `storefront.spec.js` › "CLI-14: …" · ❓ ver pregunta 2 |

## Configuración

| Qué | Dónde | Valor actual |
| --- | --- | --- |
| Condiciones frente al IVA y qué documento piden | `fiscal_config.js` › `condicionesIva` | 4 condiciones |
| Datos fiscales de la distribuidora | `fiscal_config.js` › `emisor` | `[COMPLETAR]` (ver pregunta 1) |
| Provincias, departamentos y localidades | `servidor/src/core/database/ubicacion/*.json` | Datos fijos de Argentina |

## Dónde está el código

- Servidor: `modulos/eccomerce_distribuidora/routes/perfil_cliente_router.js` → `controllers/perfil_cliente_controller.js`
  → `services/perfil_cliente_service.js`; validación en `services/datos_cliente.js` y `fiscal_config.js`;
  listas en `routes/ubicacion/` (core).
- Frontend: `modules/eccomerce_distribuidora/perfil/perfil_page.jsx` y el paso de datos de la nota de pedido.
- Listado (CLI-11 a CLI-14): `routes/clientes_distribuidora_router.js` → `controllers/clientes_distribuidora_controller.js` →
  `services/clientes_distribuidora_service.js` (una consulta paginada); pantalla `admin/clientes_page.jsx`; el filtro por
  cliente de la gestión de notas es el parámetro `cliente` de `listarTodas` (`nota_pedido_service.js`).

## Decisiones

| Fecha | Regla | Decisión | Quién |
| --- | --- | --- | --- |
| 2026-10 | CLI-03 | Condición frente al IVA obligatoria; CUIT válido, y Consumidor Final acepta DNI. La facturación electrónica queda documentada para más adelante. | Cliente |
| 2026-11-08 | CLI-11 | Hace falta un listado de clientes en el panel, solo con los de datos completos. "Completos" es lo que ya se pide hoy: la razón social sigue siendo opcional. | Cliente |

## Preguntas abiertas

1. **CLI-10 — Datos fiscales de la distribuidora.** En `fiscal_config.js` › `emisor` faltan la condición
   frente al IVA, la razón social y el domicilio comercial de la distribuidora, tal como figuran en ARCA.
   Sin la condición, la factura sugerida que ve la gestión puede no ser la correcta. No es una decisión,
   es un dato del cliente: ¿ya lo tenés?
   **Respuesta:** ⏳ Esperando al cliente (2026-11-08: todavía no lo tienen).

2. **CLI-14 — ¿Quién puede ver el listado de clientes?** Muestra datos personales de todos los clientes.
   Opciones: (a) de entrada lo tienen supervisor y vendedor (los que atienden pedidos); (b) solo el admin y
   a los demás se lo tildás en Roles y permisos; (c) lo ve quien tiene "Ver pedidos". Recomendación: (a).
   **Mientras tanto** quedó programado como (b), lo más reservado: si elegís (a), se tilda en el panel sin
   cambiar código.
   **Respuesta:** ⏳ Esperando al cliente (preguntado en el documento de usuarios y permisos).
