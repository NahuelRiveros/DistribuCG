import { cn } from "../../lib/cn";
import SearchInput from "./SearchInput";

/**
 * Barra de herramientas de tabla — encima de AppTable.
 * Combina búsqueda, filtros y un botón de acción principal.
 *
 * Uso básico:
 *   <TableToolbar
 *     searchValue={q}
 *     onSearch={setQ}
 *     action={<Button label="Nuevo" variant="cyan" icon={Plus} />}
 *   />
 *
 * Con filtros adicionales:
 *   <TableToolbar
 *     searchValue={q}
 *     onSearch={setQ}
 *     filters={
 *       <SelectField name="rol" value={rol} onChange={setRol} options={roles} />
 *     }
 *     action={<Button label="Nuevo" variant="cyan" />}
 *   />
 *
 * Sin búsqueda (solo acción):
 *   <TableToolbar action={<Button label="Exportar" />} />
 *
 * Props:
 *   searchValue       — string — valor de búsqueda (controlado)
 *   onSearch          — (value: string) => void — omitir para ocultar el campo
 *   searchPlaceholder — placeholder del campo de búsqueda
 *   filters           — nodo React — filtros adicionales (selects, chips, etc.)
 *   action            — nodo React — botón principal (esquina derecha)
 *   className         — clases extra en el contenedor
 */
export default function TableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = "Buscar...",
  filters,
  action,
  className = "",
}) {
  const hasSearch = typeof onSearch === "function";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Izquierda: búsqueda + filtros */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {hasSearch && (
          <SearchInput
            value={searchValue ?? ""}
            onChange={onSearch}
            placeholder={searchPlaceholder}
          />
        )}
        {filters && (
          <div className="flex flex-wrap items-center gap-2">{filters}</div>
        )}
      </div>

      {/* Derecha: acción principal */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}
