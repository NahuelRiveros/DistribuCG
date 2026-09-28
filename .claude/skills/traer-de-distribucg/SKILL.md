---
name: traer-de-distribucg
description: Trae una pieza (archivo, componente, servicio, modelo o flujo) del proyecto anterior DistribuCG a este proyecto, adaptándola a las reglas de CLAUDE.md y descartando lo específico de otros rubros. Usar cuando se quiera reutilizar algo que ya funciona en DistribuCG.
argument-hint: <pieza, ej. "data_grid" o "notas de pedido" o "importación de catálogo">
---

# Traer de DistribuCG: $ARGUMENTS

Origen: `C:\Users\nahue\OneDrive\Documentos\GitHub\DistribuCG` (solo lectura: **nunca modificar ese repo**).

1. Buscar la pieza en `docs/ORIGEN_DISTRIBUCG.md` para ver la acción (Traer / Adaptar / No traer) y el destino. Si figura como "No traer", avisar y proponer alternativa.
2. Leer el original **completo**, más sus dependencias directas (imports) y dónde se usa. Nunca leer archivos `.env`.
3. Listar al usuario, antes de escribir:
   - Qué se copia tal cual.
   - Qué se adapta y por qué (regla de `CLAUDE.md` que aplica).
   - Qué se descarta (código de gym, kinesiología, indumentaria, `sin_usar/`, `proyecto_futuro/`, textos o colores de un cliente puntual, comentarios sobre historia vieja).
   - Dependencias que también hay que traer primero.
4. Adaptaciones obligatorias:
   - Ubicación nueva según `CLAUDE.md` (una carpeta por módulo; `nucleo/` para lo compartido).
   - Nombres sin sufijos de rubro (`producto_distribuidora` → `producto`).
   - Controladores sin try/catch; errores con `ErrorApp`; validación con Zod.
   - Cambios de base como **migración** (no `sync`).
   - Textos/colores/links de un cliente → `frontend/src/clientes/<id>/`.
   - Stock siempre por `stock_servicio.registrarMovimiento()`.
5. Escribir el código y **tests** (si el original no tenía, crearlos).
6. Ejecutar lint + tests y mostrar la salida.
7. Marcar la fila como hecha (`[x]`) en `docs/ORIGEN_DISTRIBUCG.md` y anotar cualquier diferencia importante con el original.
