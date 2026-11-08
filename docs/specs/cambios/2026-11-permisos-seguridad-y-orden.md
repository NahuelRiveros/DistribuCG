# Cambio: permisos más seguros y en un solo archivo

| Estado | Pedido por | Fecha | Spec del módulo |
| --- | --- | --- | --- |
| Hecha | Dueño del proyecto | 2026-11-08 | [core/permisos.md](../core/permisos.md) |

## Por qué

- Una ruta que la web no usa (`POST /api/admin/usuarios`) crea usuarios con cualquier rol, sin
  control: alguien con "Gestionar personal" podría crearse un super admin.
- Al personal se le pide una contraseña de 4 caracteres, más débil que la de los clientes (8),
  aunque tiene más acceso.
- El rol "profesional" quedó del gimnasio: el arranque lo sigue creando y aparece en la
  configuración sin ningún uso.
- Los permisos están repartidos en dos archivos y cuesta saber dónde tocar.

## Requisitos

| Código | Requisito | Estado |
| --- | --- | --- |
| PER-26 | No existen `POST` ni `GET /api/admin/usuarios`: pedirlas responde "no encontrado". El alta del personal pasa solo por "Personal" (`/api/staff`), que controla los roles. | ✅ |
| PER-20 | Crear a alguien del personal o cambiarle la contraseña exige de 8 a 72 caracteres, con el mismo mensaje que el registro de clientes. Las contraseñas actuales siguen sirviendo para ingresar. | ✅ |
| PER-13 | El arranque ya no crea el rol "profesional" y lo borra si nadie lo tiene. Si alguien lo tiene, no lo borra y deja un aviso en el registro del servidor para resolverlo a mano. | ✅ |
| PER-33 | Todos los permisos (core y rubros) están en `permisos_config.js`, en un bloque CORE y un bloque por rubro, cada uno con un comentario de qué borrar para un proyecto sin ese rubro. La lista final queda idéntica: mismos códigos, grupos, orden y roles de entrada. | ✅ |

**Fuera de alcance:** cambiar qué permisos existen o quién los recibe de entrada; los tests ⚠️
pendientes de "Personal" (PER-21 a PER-25), que van en su propio trabajo.

## Diseño

- **API:** se borran `routes/usuarios/admin_usuarios_router.js`, su controlador y
  `services/usuarios/admin_usuarios_service.js`, y su línea en `routes/index.js`.
  Antes de borrar se verifica que nada más los use.
- **Contraseña del personal:** `admin_staff_service.js` (alta y cambio de contraseña) usa los mismos
  límites que los clientes (`client_config.js` › `auth.passwordMinLength` / `passwordMaxLength`).
  El formulario del panel (`staff_form_modal.jsx`) dice "Mínimo 8 caracteres" y valida lo mismo.
- **Rol profesional:** se saca de `seed_rbac.js` y de `rolesFuera`. Al arrancar, si el rol existe y no
  tiene personas, se borra con sus permisos; si tiene, se conserva y se avisa en el log.
- **Archivo único:** el contenido de `modulos_compartidos/eccomerce_distribuidora/permisos.js` vuelve a
  `permisos_config.js` en un bloque "RUBRO: distribuidora" y se borra la carpeta `modulos_compartidos/`.
  Se compara la lista antes y después (como en la Fase 3) para confirmar que es idéntica: si un
  código cambiara, el arranque borraría sus asignaciones del panel.
- **Base de datos:** sin cambios de estructura. Solo puede borrarse la fila del rol "profesional".
- **Pantallas:** solo el texto y la validación del campo contraseña en el formulario de personal.

## Tareas

1. [x] Tests (fallan al principio): PER-26 (las dos rutas responden 404); PER-20 (alta y cambio con
   7 caracteres se rechazan, con 8 se aceptan; un usuario con contraseña vieja de 5 sigue ingresando);
   PER-13 (con el rol sin personas se borra; con personas se conserva); PER-33 (la lista de permisos es
   idéntica a la actual).
2. [x] Servidor: borrar las rutas de `admin/usuarios`; contraseña en `admin_staff_service.js`;
   rol profesional en `seed_rbac.js` y `permisos_config.js`.
3. [x] Unificar `permisos_config.js` y borrar `modulos_compartidos/`.
4. [x] Frontend: texto y validación de la contraseña en `staff_form_modal.jsx` y `staff_password_modal.jsx` (el cambio de contraseña tenía la misma regla de 4).
5. [x] Actualizar `CLAUDE.md` (hoy menciona `modulos_compartidos/`).
6. [x] `node scripts/verificar.mjs --completo` en verde.
7. [x] Pasar PER-13, PER-20, PER-26 y PER-33 a ✅ en la spec del módulo y marcar este cambio como hecho.

## Riesgos

- **Alguien usaba la ruta borrada desde afuera** (un script o una integración): no hay rastros en el
  código, pero si existiera dejaría de funcionar. Se resuelve usando `/api/staff`.
- **Un código de permiso cambia al mover el bloque:** el arranque borraría lo tildado en el panel.
  Lo cubre la comparación antes y después y el test de PER-33.
- **Personal con el rol "profesional" en la base:** no se borra nada; queda el aviso para decidir.
