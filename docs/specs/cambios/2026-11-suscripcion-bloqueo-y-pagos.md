# Cambio: bloqueo del panel con el plan vencido y pagos que se suman una sola vez

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Borrador | Dueño del proyecto | 2026-11-08 | [core/sistema.md](../core/sistema.md) |

## Por qué

- Si un cliente deja de pagar el software, el sistema sigue funcionando casi igual: el bloqueo deja
  pasar a cualquiera que haya ingresado.
- MercadoPago avisa el mismo pago varias veces y cada aviso suma 30 días: un pago puede valer dos o tres meses.
- La gracia es de 3 días, pero el cobro es a mes vencido y el cliente paga en los primeros días del mes.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| SIS-01 | La gracia dura 10 días después del vencimiento; recién después el estado pasa a "vencido". | 🚧 |
| SIS-04 | Un pago aprobado extiende 30 días una sola vez: si MercadoPago lo vuelve a avisar, no suma nada. Al extender, el bloqueo se levanta en el momento (sin esperar 5 minutos). | 🚧 |
| SIS-05 | Con el plan vencido, a quien tiene un rol del personal (admin incluido) se le rechaza crear, modificar o borrar, con el aviso "Plan vencido. Renovalo para registrar nuevos datos.". Pasa siempre: ver, ingresar, salir, pagar y todo lo del super admin. Clientes y visitantes no se bloquean (carrito, pedidos, perfil, registro). | 🚧 |

**Fuera de alcance:** cambiar el precio o el período (30 días), avisarle al personal que no es admin
antes del vencimiento, y la caché de "Módulos habilitados" (mejora técnica anotada en la spec).

## Diseño

- **SIS-05, quién se bloquea:** el bloqueo pasa a ser una función pura y probable sin base,
  `debeBloquear({ estado, metodo, ruta, roles })`. El middleware la llama solo cuando el plan está vencido
  (lo normal es que no lo esté, así que no agrega consultas), y recién ahí lee los roles de quien pide.
  Se deja de aceptar "cualquier sesión válida": un cliente con sesión o un visitante pasa porque no es
  personal, no porque tenga sesión. Las rutas libres siguen siendo `/auth`, `/suscripcion`, `/health` y
  `/catalogos`.
- **SIS-04, pago una sola vez:** en una sola transacción se anota el pago (`INSERT … ON CONFLICT
  (mp_payment_id) DO NOTHING`) y **solo si se anotó** se extienden los 30 días. Después se limpia el estado
  guardado en memoria (`invalidarCacheSuscripcion`), igual que hoy al extender a mano.
- **SIS-01:** `DIAS_GRACIA = 10` y se corrige el comentario del encabezado.
- **Base de datos:** sin cambios de estructura. Las tablas de la suscripción viven en el schema `public`
  (no en `gc_dist`) y se quedan ahí. Para poder probarlas sin tocar `public`, el nombre del schema de esas
  tablas pasa a ser un parámetro interno, `public` por defecto; el test de integración usa su schema temporal.
- **Pantallas:** sin cambios. El aviso de 402 ya se muestra donde falla la acción.

## Tareas

1. [ ] Tests (fallan al principio):
   - Unitarios: estados con 10 días de gracia (día 1, día 10 y día 11 después del vencimiento);
     `debeBloquear` (personal bloqueado, admin bloqueado, super admin libre, cliente y visitante libres,
     GET libre, pagar libre, plan al día sin bloqueo).
   - Integración, en el schema temporal: el mismo pago avisado tres veces extiende 30 días una sola vez.
2. [ ] Servidor: `software_suscripcion_service.js` (gracia, pago idempotente, schema configurable),
   `suscripcion_middleware.js` (`debeBloquear`), webhook en `suscripcion_controller.js`.
3. [ ] `node scripts/verificar.mjs --completo` en verde.
4. [ ] Pasar SIS-01, SIS-04 y SIS-05 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Una instalación ya vencida hoy:** al desplegar, su personal deja de poder modificar datos (hoy no se
  bloqueaba). Antes de desplegar, revisar el estado de cada cliente y extender si corresponde.
- **El super admin necesita poder siempre:** queda libre a propósito, para poder arreglar o extender.
- **Un error al leer los roles con el plan vencido:** se deja pasar, igual que hoy cuando falla la consulta
  del estado (SIS-06): un problema técnico no frena el negocio.
