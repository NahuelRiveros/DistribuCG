# Diagnóstico de acceso del administrador

Desde 2026-11 (core traído de CoreSistem), el administrador del sistema se configura solo con
`SUPERADMIN_USUARIO` y `SUPERADMIN_CONTRASENA` (antes: `SUPERADMIN_EMAIL`, `SUPERADMIN_DNI`,
`SUPERADMIN_PASSWORD`, `SUPERADMIN_NOMBRE` y `SUPERADMIN_APELLIDO`, que ya no se usan para crearlo). El email
es fijo en el core (`SUPERADMIN_EMAIL_FIJO`, igual en todos los proyectos) y sirve para recuperar el acceso.
`SUPERADMIN_CONTRASENA` todavía acepta el nombre viejo `SUPERADMIN_PASSWORD`.

Qué hace el arranque (seed):

- Sin `SUPERADMIN_USUARIO`, no crea nada: el administrador que ya existe sigue entrando como antes (con su email).
- Con `SUPERADMIN_USUARIO`: si ya hay un usuario con ese nombre, lo deja como está. Si no, busca la persona con el
  email fijo; si existe y tiene usuario, le agrega ese nombre de usuario (si no tenía). Si no hay ninguna persona
  con el email fijo, **crea un administrador nuevo**.
- Nunca cambia una contraseña existente: cambiar las variables de Render no actualiza credenciales.

> ⚠️ Si el administrador actual de DistribuCG tiene un email distinto del fijo, completar `SUPERADMIN_USUARIO`
> crea un **segundo** administrador. Para evitarlo: dejá `SUPERADMIN_USUARIO` vacío, o primero cambiá el email
> del administrador actual al fijo desde la app.

Para comprobar el entorno que presenta el fallo, desde `servidor` en ese servicio ejecutar:

```sh
npm run admin:verificar
```

El comando consulta la base configurada en ese entorno e informa su esquema. No ejecuta seeds, login,
bootstrap, cambios de contraseña ni escrituras. La contraseña y el hash no se imprimen. El resultado distingue:

- `CONFIGURACION_INCOMPLETA`: faltan `SUPERADMIN_USUARIO` o `SUPERADMIN_CONTRASENA`.
- `CUENTA_NO_CREADA`: no hay un usuario con ese nombre en esta base.
- `USUARIO_INACTIVO` / `USUARIO_ELIMINADO`.
- `CONTRASENA_DIFERENTE`: la contraseña configurada no es la guardada (el seed no la pisa).
- `SIN_ROL_ADMIN` o `CREDENCIALES_CORRECTAS`.

Ejecutarlo en la PC comprueba la base local, no la de Render, salvo que la conexión esté configurada
explícitamente para ese destino.

Si el resultado es `CONTRASENA_DIFERENTE`, usar la contraseña original o "Olvidé mi contraseña" (llega al email
fijo, si el correo está configurado). El diagnóstico no cambia cuentas ni contraseñas.

Un 401 aislado en la consola no distingue todos estos casos. Revisar también el JSON de Network → login →
Response y la salida del seed en el último arranque de Render, que muestra el usuario y si la contraseña se
creó o se conservó.
