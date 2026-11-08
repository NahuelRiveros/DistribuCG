# Cambio: sesión más larga para clientes y mensaje de ingreso genérico

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-08 | [core/usuarios.md](../core/usuarios.md) |

## Por qué

- Un cliente que compra cada semana tiene que volver a ingresar en cada compra, porque la sesión
  dura 24 horas para todos.
- Al ingresar, el sistema contesta "Usuario inactivo" o "La persona no tiene usuario habilitado":
  quien prueba con un email ajeno puede averiguar si esa cuenta existe.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| USU-04 | Cuenta desactivada, dada de baja o persona sin usuario: el ingreso con contraseña responde lo mismo que una contraseña incorrecta ("Email, usuario o contraseña incorrectos"), y el ingreso con Google responde lo mismo que una credencial de Google inválida. | ✅ |
| USU-06 | Quien solo tiene el rol cliente recibe una sesión de 30 días; quien tiene cualquier otro rol (supervisor, vendedor, admin, super admin o uno creado en el panel), de 24 horas, aunque también sea cliente. | ✅ |
| USU-09 | Una sesión abierta como cliente deja de valer si esa persona pasa a tener un rol del personal: tiene que volver a ingresar, y recibe la sesión de 24 horas. | ✅ |

**Fuera de alcance:** "recordarme" opcional en la pantalla de ingreso, cerrar sesión en todos los
dispositivos a pedido y cambiar los límites de intentos (USU-05).

**Lo que no cambia:** desactivar o dar de baja una cuenta, o cambiar su contraseña, la saca del
sistema en el próximo pedido aunque su sesión dure 30 días (eso ya se revisa en cada pedido).

## Diseño

- **API:** sin rutas nuevas. `POST /api/auth/login` y `POST /api/auth/google` cambian solo el
  mensaje y el código de error en los casos de USU-04 (`CREDENCIALES_INVALIDAS` y `GOOGLE_INVALIDO`).
- **Base de datos:** sin cambios.
- **Sesión:** el token guarda con qué tipo de sesión se abrió (`cliente` o `personal`). El middleware
  rechaza una sesión `cliente` si la persona hoy tiene un rol del personal (USU-09) y responde como
  sesión vencida: la web ya sabe manejar eso y manda a ingresar.
- **Configuración:** en `client_config.js` › `auth`, dos valores nuevos: `sesionClienteDias: 30` y
  `sesionPersonalHoras: 24`. Se quita la lectura de `JWT_EXPIRES_IN`, que hoy no existe en `env.js`.
- **Pantallas:** sin cambios. El mensaje genérico ya existe y se muestra igual que hoy.

## Tareas

1. [x] Tests (fallan al principio): USU-04 con cuenta inactiva, dada de baja y sin usuario, con
   contraseña y con Google; USU-06 con cliente, con personal y con alguien que es las dos cosas;
   USU-09 con un cliente al que se le da un rol del personal.
2. [x] Servidor: `auth_service.js` (mensajes y duración según roles), `auth_middleware.js` (USU-09),
   `client_config.js` (los dos valores nuevos).
3. [x] Revisar que la pantalla "Personal" del admin siga mostrando si una cuenta está inactiva:
   es donde ahora se averigua por qué alguien del personal no puede entrar.
4. [x] `node scripts/verificar.mjs --completo` en verde.
5. [x] Pasar USU-04, USU-06 y USU-09 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Sesiones ya abiertas:** las de hoy no tienen tipo de sesión. Se tratan como `personal`: siguen
  hasta vencer a sus 24 horas, y desde el próximo ingreso cada uno recibe la duración que le toca.
- **Teléfono perdido o compartido:** con 30 días, alguien con el teléfono de un cliente puede ver sus
  pedidos y hacer uno nuevo durante más tiempo. No puede cobrar ni ver datos de otros, y el cliente
  lo corta cambiando su contraseña (USU-07).
- **Personal que se queja de no poder entrar:** con el mensaje genérico ya no ve "Usuario inactivo".
  Lo resuelve el admin desde "Personal".
