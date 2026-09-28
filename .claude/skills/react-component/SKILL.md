---
name: react-component
description: Genera un componente React (JavaScript + JSX, archivo snake_case) con Tailwind, su hook de datos con TanStack Query si necesita el servidor, y su test con Testing Library + MSW. Usar para cualquier componente o pantalla nueva.
argument-hint: <nombre_componente — módulo — descripción>
---

# Componente: $ARGUMENTS

1. Buscar en `frontend/src/componentes/ui/`, en el módulo y en DistribuCG (`docs/ORIGEN_DISTRIBUCG.md`) si ya existe algo reutilizable.
2. Ubicación:
   - Genérico sin lógica de negocio → `src/componentes/ui/<nombre>.jsx`
   - Del módulo → `src/modulos/<modulo>/<submodulo>/<nombre>.jsx`
   - Contenido de un cliente (textos, imágenes, links) → NO va en el componente: se lee de `src/clientes/<id>/`.
3. Si usa datos del servidor:
   - `src/modulos/<modulo>/api/<modulo>_api.js`: funciones con `http` que devuelven `r.data`.
   - `src/modulos/<modulo>/hooks/use_<algo>.js`: `useQuery` / `useMutation` con query keys del módulo; invalidar al guardar.
4. Componente:
   - Props desestructuradas con valores por defecto; sin llamadas HTTP adentro.
   - Estados: cargando, error (mensaje + reintentar), vacío, con datos.
   - Formularios: React Hook Form + `zodResolver(schema de @compartido)`, error debajo de cada campo, botón deshabilitado mientras envía.
   - Tailwind con tokens del tema, mobile-first, accesible.
5. Test `<nombre>.test.jsx`: render, interacción con `userEvent`, cargando/error con MSW. Buscar por rol o texto visible.
6. Ejecutar `npm run test:web -- <nombre>` y mostrar la salida.
