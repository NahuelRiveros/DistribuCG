# Qué se trae de DistribuCG

Origen: `C:\Users\nahue\OneDrive\Documentos\GitHub\DistribuCG` (en adelante `DCG`).
Se trae **por piezas**, con `/traer-de-distribucg <pieza>`, adaptando cada una a `CLAUDE.md`.
Marcar cada fila al completarla: `[x]` hecho · `[~]` parcial · `[ ]` pendiente.

Leyenda: **Traer** = copiar casi igual · **Adaptar** = la idea sirve, se reescribe con las reglas nuevas · **No traer** = específico de otro rubro o reemplazado.

## Servidor

| Estado | Pieza en DCG | Acción | Destino / notas |
|---|---|---|---|
| [x] | `servidor/src/models/common/define_model.js` | Traer | `nucleo/db/define_model.js` — ahora con `creado_en`/`actualizado_en` automáticos |
| [x] | `servidor/src/models/common/relaciones.js` | Traer | `nucleo/db/relaciones.js` — igual al original |
| [x] | `servidor/src/database/sequelize.js` | Traer | `nucleo/db/sequelize.js` — pool y reintentos para Neon; schema por proyecto |
| [x] | `servidor/src/database/bootstrap.js` | Adaptar | `nucleo/db/preparar_base.js`: al arrancar aplica migraciones pendientes (no `sync`) y datos base, con candado para varias instancias |
| [x] | `servidor/src/configuracion_servidor/env.js` | Adaptar | `nucleo/env.js` validado con Zod; mismos nombres `DB_*` que DCG |
| [x] | `servidor/src/app.js` | Adaptar | helmet/cors/compression + `manejador_errores` central + `modulos/registro.js` |
| [x] | `servidor/src/middleware/auth_middleware.js` | Traer | `nucleo/auth/middlewares.js` + `tokens.js` (versión de contraseña en el token) |
| [x] | `servidor/src/middleware/modulo_middleware.js` | Adaptar | `requerirModulo()` leyendo `proyecto.config.js` (404 si está apagado) |
| [x] | `servidor/src/services/common/pagination.js` | Traer | `nucleo/paginacion.js` (nombres en español) |
| [x] | `servidor/src/services/common/query_helpers.js` | Traer | `nucleo/consultas.js` (`pick`, `armarBusquedaTexto`) |
| [ ] | `servidor/src/services/common/crud_service.js` | Traer | `nucleo/crud_servicio.js` (cuando llegue el primer ABM) |
| [x] | `servidor/src/services/common/upload_service.js` + `cloudinary.js` | Traer | `nucleo/imagenes.js` + `nucleo/archivos.js` (multer con errores en español); galería por producto con orden |
| [ ] | `servidor/src/services/common/mail_service.js` | Traer | `nucleo/mail/` (recuperación de contraseña, avisos de pedido) |
| [x] | `servidor/src/services/common/importacion/*` | Traer | `modulos/catalogo/importacion/` — lector en worker; **xlsx sin streaming** (el streaming de exceljs fallaba de forma intermitente) |
| [x] | `controllers/*` con try/catch en cada función | Adaptar | controladores sin try/catch + errores `ErrorApp` (ver `modulos/usuarios/`) |
| [x] | `validator/*.js` (validación manual) | Adaptar | schemas Zod en `compartido/schemas/` + `nucleo/validar.js` |
| [~] | usuarios: `models/usuario/*`, `models/persona/*`, `services/usuarios/*` | Adaptar | `modulos/usuarios/`: login y perfil hechos, sin tabla persona. Falta registro y recuperación de contraseña |
| [x] | `seed_rbac.js`, `seed_super_admin.js` | Adaptar | `seeds/index.js` idempotente (roles + super admin desde `.env`) |
| [x] | distribuidora: `categoria_distribuidora`, `producto_distribuidora`, `variedad_distribuidora` | Adaptar | `modulos/catalogo/` (API, paso 3a): varias presentaciones por producto, descendientes con `WITH RECURSIVE` en vez de caché en memoria |
| [x] | distribuidora: importación de catálogo (`importacion_distribuidora_*`, `catalog_import_config.js`) | Adaptar | `modulos/catalogo/importacion/` + `compartido/importacion_catalogo.js`. Sin columna Stock hasta el paso 4. Sin perfiles de mapeo guardados (pendiente) |
| [x] | distribuidora: `carrito_distribuidora*`, `cart_transaction.js`, `operacion_carrito` | Adaptar | `modulos/tienda/carrito_servicio.js` + `idempotencia.js`; carrito de invitado con fusión idempotente |
| [x] | distribuidora: `nota_pedido*` (estados, log, pagos parciales, snapshot) | Adaptar | `modulos/tienda/pedido_servicio.js` + `cobro_servicio.js`; ahora reserva/descuenta stock según el estado (`compartido/reglas/pedido_stock.js`) |
| [x] | `order_config.js` (transiciones de estado) | Traer | `proyecto.config.js` → `pedidos` + `compartido/reglas/pedido_transiciones.js` |
| [x] | `perfil_cliente_distribuidora` | Adaptar | `modulos/tienda/perfil_servicio.js` (teléfono y dirección obligatorios; CUIT opcional) |
| [x] | `models/kiosco/movimiento_stock.js` | Adaptar | `modulos/stock/`: por presentación, con reservas, historial inmutable (trigger) y descuento atómico sin sobreventa |
| [ ] | `services/ubicacion` + JSON de provincias/localidades | Traer | `nucleo/ubicacion/` (direcciones de entrega) |
| [ ] | `sistema/banner_anuncio` | Traer (opcional) | anuncios en la tienda |
| — | gym, kinesiología, seguimiento, alumno, `proyecto_futuro/`, `sin_usar/` | **No traer** | Otro rubro o código muerto |
| — | indumentaria (`models/productos/*`, `models/carrito/*`) | **No traer** | Se unifica en un solo catálogo con variantes (talle/color = atributos de variante) |
| — | `modulo_negocio` (toggle desde super-admin) | Decidir después | Por ahora los módulos se prenden en `proyecto.config.js` |

## Frontend

| Estado | Pieza en DCG | Acción | Destino / notas |
|---|---|---|---|
| [x] | `frontend/src/api/http.js` | Traer | `src/api/http.js` + `mensajeDeError()` |
| [x] | `frontend/src/auth/auth_context.jsx` | Adaptar | `src/modulos/usuarios/auth_context.jsx` |
| [x] | `controls/acceso/*` (protected_route, return_to) | Traer | `src/componentes/acceso/ruta_protegida.jsx`, `volver_a.js` |
| [x] | `controls/ui/*` (input_field, select_field, data_grid, modal, confirm_dialog, pagination, search_field, quantity_input, tree_view, image_upload_field...) | Traer | Hechos con tokens del tema: input, select, textarea, checkbox, modal, confirm_dialog, paginacion, search_field, boton, insignia, estado_carga. image_upload_field → `catalogo/admin/imagenes_producto.jsx`; quantity_input → `tienda/componentes/selector_cantidad.jsx`. data_grid → `componentes/ui/tabla.jsx` (sin búsqueda/orden internos: eso lo hace el servidor; en celular, tarjetas); tree_view → árbol más simple en categorías |
| [x] | `controls/toast/toast_context.jsx`, `error_boundary.jsx` | Traer | toast en `componentes/toast/`; error_boundary → `app/error_page.jsx` (errorElement del router, detecta "versión nueva" después de un deploy) |
| [x] | `controls/sistema/server_status_banner.jsx` (borrador) | Adaptar | `componentes/sistema/aviso_servidor.jsx`: aviso no bloqueante "Despertando el servidor…" (Render) / "Sin conexión", reintenta solo |
| [x] | `controls/modales/staff_form_modal.jsx`, `staff_password_modal.jsx` (borrador) | Adaptar | Sistema → Usuarios: `modulos/usuarios/admin/` + `/api/usuarios`. Un solo rol por usuario; admin gestiona personal y clientes, solo el super admin crea admins |
| [x] | `controls/layout/*` (app_layout, navbar/*, footer) | Adaptar | `src/componentes/layout/` leyendo `clientes/<id>/` |
| [x] | `config/brand_config.js`, `theme_config.js`, `logo_config.js` | Adaptar | `src/clientes/<id>/marca.js`, `tema.js`, `assets/` |
| [x] | `config/home_config.js` + `modules/home/*` | Adaptar | `src/clientes/<id>/home.js` + `src/modulos/home/secciones/` (hero, pilares, pasos, contacto) |
| [x] | `config/footer_config.js` | Adaptar | `src/clientes/<id>/footer.js` |
| [x] | `config/navbar_config/*` | Adaptar | `src/clientes/<id>/navbar.js` + cada módulo aporta `navbar` y `menuAdmin` (panel con menú lateral) |
| [x] | `controls/importacion/*` (wizard de importación) | Traer | `src/modulos/catalogo/admin/importacion/` (arreglado: la limpieza del efecto pausaba la carga) |
| [x] | `modules/eccomerce_distribuidora/*` | Adaptar | Catálogo (`modulos/catalogo/`) y tienda (`modulos/tienda/`: carrito, envío, mis pedidos, panel de pedidos y cobros) |
| [x] | carrito invitado (`guest_storage.js`, `use_persistent_cart.js`, validaciones) | Adaptar | `src/modulos/tienda/hooks/use_carrito.js`: un solo carrito con y sin cuenta |
| [x] | `utils/*`, `index.css` (tokens `--kt-*`) | Traer | `src/utils/cn.js` + `src/index.css` con tokens neutros en español |
| [x] | `playwright.config.js` + `tests/browser` | Adaptar | `playwright.config.js` + `e2e/` en la raíz (escritorio y celular) |
| — | `modules/gym`, `modules/kinesiologia`, `modules/eccomerce_indumentaria`, `_scaffold/` | **No traer** | Otro rubro; los scaffolds se reemplazan por skills |

## Problemas de DCG que NO se repiten acá

1. Configuración de cliente dispersa en ~15 archivos → ahora `proyecto.config.js` + `frontend/src/clientes/<id>/`.
2. Tres sistemas de stock → uno solo (`modulos/stock/`) con movimientos.
3. Dos e-commerce duplicados → un catálogo con variantes.
4. `sync({alter})` + ajustes a mano en `bootstrap.js` → migraciones Umzug con `up`/`down`.
5. Módulos repartidos en 4 carpetas por capa → una carpeta por módulo.
6. try/catch repetido en cada controlador → manejador de errores central.
7. Código muerto (`sin_usar/`, `proyecto_futuro/`) → prohibido.
8. `CLAUDE.md` desactualizado → se actualiza en el mismo cambio que modifica la estructura.
