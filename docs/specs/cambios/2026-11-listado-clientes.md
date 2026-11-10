# Cambio: listado de clientes en el panel

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha (CLI-14 a confirmar) | Cliente | 2026-11-08 | [eccomerce_distribuidora/clientes.md](../eccomerce_distribuidora/clientes.md) |

## Por qué

Hoy los datos de un cliente solo se ven dentro de cada uno de sus pedidos. La distribuidora necesita
un listado de sus clientes, con los datos completos, para tenerlos a mano (contacto, facturación, reparto).

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| CLI-11 | En el panel hay una pantalla "Clientes" con los clientes que tienen los datos completos (nombre, apellido, celular, condición frente al IVA, CUIT o DNI, dirección, provincia y localidad). Muestra además razón social y email si los tiene. | ✅ |
| CLI-12 | Se busca por nombre, apellido, razón social, CUIT/DNI o email, y se filtra por localidad. Muestra hasta 50 por página. | ✅ |
| CLI-13 | Desde un cliente se llega a sus pedidos (la gestión de notas filtrada por ese cliente). | ✅ |
| CLI-14 | Ver el listado pide un permiso propio, y el servidor lo controla. Los clientes con datos incompletos no aparecen. | ✅ · ❓ de entrada solo admin (ver pregunta 1) |

**Fuera de alcance:** editar los datos de un cliente desde el panel (los cambia el cliente en "Mis datos"),
exportar el listado a Excel, y un listado de los clientes con datos incompletos.

## Diseño

- **API:** `GET /api/distribuidora/clientes` con `q`, `localidad`, `pagina`; devuelve los campos de CLI-11 y
  la cantidad de pedidos de cada cliente. Paginada en el servidor (50), con una sola consulta por página:
  sin consultas por cada cliente.
- **Permiso:** uno nuevo en el bloque de la distribuidora de `permisos_config.js` (ver pregunta 1); el
  arranque lo crea y se lo da a los roles "de entrada" la primera vez.
- **"Datos completos":** la misma regla que ya usa el primer pedido (`datosClienteCompletos`), para que no
  haya dos definiciones distintas.
- **Base de datos:** sin cambios.
- **Pantallas:** "Clientes" dentro del grupo "Distribuidora" del panel, con carga, error con reintentar y
  "todavía no hay clientes con datos completos". En celular, cada cliente como tarjeta.

## Tareas

1. [x] Tests (fallan al principio): solo aparecen los completos; búsqueda y filtro; sin el permiso responde
   403; paginación; el enlace a sus pedidos.
2. [x] Servidor: ruta, controlador y servicio en `modulos/eccomerce_distribuidora/`; permiso nuevo.
3. [x] Frontend: pantalla, ítem del menú del panel y filtro por cliente en la gestión de notas.
4. [x] `node scripts/verificar.mjs --completo` en verde y revisión visual en escritorio y celular.
5. [x] Pasar CLI-11 a CLI-14 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Datos personales:** el listado junta DNI, celular y domicilio de todos los clientes. Por eso pide un
  permiso propio y no se muestra a quien no lo tiene.
- **Costo en la base:** con muchos clientes, buscar "datos completos" en cada página tiene que ser una sola
  consulta paginada.

## Preguntas abiertas

1. **CLI-14 — ¿Quién puede ver el listado?** Muestra datos personales de todos los clientes. Opciones:
   (a) un permiso nuevo, "Ver clientes", que de entrada tengan supervisor y vendedor (los que atienden pedidos);
   (b) el mismo permiso nuevo, pero de entrada solo el admin (los demás, si se lo tildás en el panel);
   (c) sin permiso nuevo: lo ve quien tiene "Ver pedidos". Recomendación: (a). El vendedor ya ve esos
   mismos datos en cada pedido, y con un permiso propio se lo podés sacar a quien quieras.
   **Respuesta:** ⏳ Esperando al cliente. Mientras tanto se programó como (b): de entrada solo admin; si elige
   (a) o (c), se tilda "Ver clientes" a esos roles en Roles y permisos, sin cambiar código.

## Decisiones

| Fecha | Decisión | Quién |
| --- | --- | --- |
| 2026-11-10 | Programar el listado sin esperar CLI-14, con el permiso de entrada solo para admin (lo más reservado). | Dueño del proyecto |
| 2026-11-10 | "Datos completos" se filtra en la misma consulta paginada (campos cargados); la validación fina (CUIT con dígito verificador) ya la hace el formulario al guardar. | Dueño del proyecto |
