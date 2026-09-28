---
name: crud-admin
description: Genera un ABM completo de panel de administración (listado paginado con búsqueda y filtros, formulario crear/editar, activar/desactivar, borrado lógico con confirmación) de punta a punta. Ideal para categorías, productos, proveedores, depósitos, clientes.
argument-hint: <entidad, ej. "proveedor">
---

# ABM de administración: $ARGUMENTS

Reutilizar SIEMPRE `componentes/ui/` (`data_grid`, `pagination`, `search_field`, `modal`, `confirm_dialog`, `input_field`, `select_field`). Si falta alguno, traerlo de DistribuCG con `traer-de-distribucg` antes de crear uno nuevo.

## Servidor (skill `api-endpoint` para cada uno)
| Método | Ruta | Rol |
|---|---|---|
| GET | `/api/<entidades>?pagina&limite&q&orden&dir&<filtros>` | admin, staff |
| GET | `/api/<entidades>/:id` | admin, staff |
| POST | `/api/<entidades>` | admin, staff |
| PUT | `/api/<entidades>/:id` | admin, staff |
| PATCH | `/api/<entidades>/:id/estado` (activar/desactivar) | admin, staff |
| DELETE | `/api/<entidades>/:id` (borrado lógico) | admin |

- Usar `crud_servicio` de `nucleo/` para listar/obtener; crear y actualizar con funciones propias del servicio.
- `orden` validado contra una lista blanca de columnas.
- Búsqueda con `armarBusquedaTexto` (ILIKE); si la tabla va a ser grande, índice `pg_trgm` por migración.

## Frontend (panel `/admin`, `src/modulos/<modulo>/admin/`)
- Las pantallas van dentro del **panel de administración** (menú lateral), nunca en el layout de la tienda.
- Registrar en `src/modulos/<modulo>/modulo.jsx`: la ruta en `rutasAdmin` (con `lazy`) y el ítem en `menuAdmin.items`. Si el módulo es nuevo, agregarlo a `src/modulos/registro.js`.
- `<entidades>_page.jsx`: búsqueda con debounce (`search_field`), filtros y paginación en la URL (`useSearchParams`). Referencia: `modulos/catalogo/admin/productos_page.jsx`.
- Formulario (modal si es chico, página si es grande) para crear y editar con el mismo componente.
- Hooks con TanStack Query en `hooks/`; invalidar las keys del módulo al guardar.
- `useToast()` al guardar, `ConfirmDialog` antes de borrar, errores del servidor en su campo con `aplicarErroresServidor()`.

## Tests
Servidor: todos los endpoints. Frontend: listado (render, búsqueda, paginación) y formulario (validación + envío).
