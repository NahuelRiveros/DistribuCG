# Changelog de `controls/`

Kit reusable entre proyectos (gym, venta online, stock, etc.): primitivas de
UI, layout (navbar/footer/app_layout), marca/theming, guard de rutas por rol
y el sistema de suscripción/módulos habilitados.

**Cómo portar una mejora a otro proyecto:** copiá el/los archivo(s) que
cambiaron, subí `CONTROLS_VERSION` en `version.js` acorde (patch = fix sin
romper nada, minor = agregado compatible, major = cambia una firma/prop que
los consumidores tienen que ajustar) y anotá acá qué cambió. Antes de pisar
un archivo en otro proyecto, revisá si ese proyecto le hizo cambios propios
al mismo archivo — si los tiene, es un merge manual, no un copy-paste.

## 1.0.0 — 2026-08-31

Extracción inicial desde el proyecto Moovs (gym + kinesiología), limpiado de
todo lo específico de ese rubro.

- `ui/`: confirm_dialog, data_grid, error_banner, error_boundary, form_error,
  icono_picker, input_field, select_field, submit_button, textarea_field.
- `layout/`: app_layout, footer, navbar/ (navbar, desktop, mobile, dropdown,
  userbox, permissions, estilos).
- `brand/`: logo_moovs (componente de logo — el SVG y los colores sí son por
  cliente, ver `config/brand_config.js`).
- `acceso/`: protected_route (guard de rutas por rol).
- `suscripcion/` + `sistema/`: banner de suscripción del sistema y banner de
  servidor caído — pensados para reusarse en cualquier proyecto que quiera el
  mismo esquema de licenciamiento/módulos habilitados.
- `modales/`: welcome_modal (genérico) y staff_form_modal / staff_password_modal
  (gestión de usuarios con rol — staff/admin).
- `config/`: apply_brand_theme, modulos_config, home_iconos — mecanismos, no
  contenido. El contenido por-proyecto vive en `src/config/` (fuera de
  `controls/`), no acá.
