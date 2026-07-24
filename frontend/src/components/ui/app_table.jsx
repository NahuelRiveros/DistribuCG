import { useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";

// ─── Estilos inline (tema claro) ─────────────────────────────────────────────
const S = {
  wrapper:           "w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm",
  inner:             "relative",
  header:            "border-b border-gray-100 px-5 py-4",
  title:             "text-base font-bold text-gray-900",
  description:       "mt-0.5 text-sm text-gray-500",
  badge:             "inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600",
  badgePurple:       "inline-flex items-center rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700",
  helperWrap:        "mt-2 text-xs text-gray-500",
  helperStrong:      "font-semibold text-gray-700",
  helperText:        "text-gray-500",
  scroll:            "overflow-x-auto",
  table:             "w-full min-w-full border-collapse text-sm",
  theadRow:          "border-b border-gray-200 bg-gray-50",
  th:                "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
  thCompact:         "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
  tbody:             "divide-y divide-gray-100",
  tr:                "transition-colors hover:bg-gray-50/60",
  trStriped:         "even:bg-gray-50/40",
  td:                "px-4 py-3 text-sm",
  tdCompact:         "px-3 py-2 text-sm",
  tdNumeric:         "font-mono text-gray-900",
  tdStrong:          "font-semibold text-gray-900",
  tdMuted:           "text-gray-600",
  actionsWrapLeft:   "flex items-center justify-start gap-1.5",
  actionsWrapRight:  "flex items-center justify-end gap-1.5",
  loadingWrap:       "flex items-center justify-center py-12",
  loadingBox:        "flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500",
  emptyWrap:         "flex items-center justify-center py-12",
  emptyBox:          "flex flex-col items-center gap-3 text-center",
  emptyIcon:         "text-gray-400",
  emptyText:         "text-sm text-gray-500",
  paginationWrap:    "border-t border-gray-100 px-5 py-3",
  paginationInfo:    "text-xs text-gray-500",
  paginationLabel:   "text-xs text-gray-500",
  paginationSelect:  "rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 outline-none",
  paginationButtonsWrap: "flex items-center gap-1",
  paginationButton:  "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
  paginationCurrent: "px-3 text-xs font-semibold text-gray-700",
  // action buttons
  actionButton:       "inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
  actionButtonPrimary:"inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-40",
  actionButtonCyan:   "inline-flex items-center rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-40",
  actionButtonDanger: "inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-40",
  actionButtonGreen:  "inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40",
  actionButtonPurple: "inline-flex items-center rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:opacity-40",
  actionButtonBlue:   "inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-40",
  actionButtonIndigo: "inline-flex items-center rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40",
  actionButtonSky:    "inline-flex items-center rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100 disabled:opacity-40",
  actionButtonTeal:   "inline-flex items-center rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:opacity-40",
  actionButtonAmber:  "inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-40",
  actionButtonYellow: "inline-flex items-center rounded-lg border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-100 disabled:opacity-40",
  actionButtonPink:   "inline-flex items-center rounded-lg border border-pink-300 bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 transition hover:bg-pink-100 disabled:opacity-40",
  actionButtonSlate:  "inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40",
};

function getVariantClass(variant = "default") {
  const map = {
    default: S.actionButton,
    primary: S.actionButtonPrimary,
    cyan:    S.actionButtonCyan,
    danger:  S.actionButtonDanger,
    success: S.actionButtonGreen,
    green:   S.actionButtonGreen,
    purple:  S.actionButtonPurple,
    blue:    S.actionButtonBlue,
    indigo:  S.actionButtonIndigo,
    sky:     S.actionButtonSky,
    teal:    S.actionButtonTeal,
    amber:   S.actionButtonAmber,
    yellow:  S.actionButtonYellow,
    pink:    S.actionButtonPink,
    slate:   S.actionButtonSlate,
    ghost:   S.actionButton,
  };
  return map[variant] || map.default;
}

function renderActions(actions, item, index) {
  return actions.map((action) => {
    const visible = typeof action.show === "function" ? action.show(item, index) : action.show !== false;
    if (!visible) return null;

    const disabled = typeof action.disabled === "function" ? action.disabled(item, index) : !!action.disabled;
    const isIconOnly = action.iconOnly === true;

    return (
      <button
        key={action.key}
        type="button"
        onClick={() => action.onClick?.(item, index)}
        disabled={disabled}
        title={action.title || action.label}
        aria-label={action.title || action.label}
        className={`${getVariantClass(action.variant)} ${isIconOnly ? "min-w-[32px] px-2" : ""} ${action.className || ""}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {action.icon  ? <span className="shrink-0">{action.icon}</span> : null}
          {!isIconOnly && action.label ? <span>{action.label}</span> : null}
        </span>
      </button>
    );
  });
}

export default function AppTable({
  title,
  description,
  helper,
  columns = [],
  data = [],
  actions = [],
  loading = false,
  loadingMessage = "Cargando...",
  emptyMessage = "No se encontraron registros.",
  emptyText,
  keyField = "id",
  className = "",
  tableWrapClassName = "",
  tableClassName = "",
  rowClassName = "",
  actionsHeader = "Acciones",
  actionsPosition = "right",
  actionsColumnClassName = "",
  compact = false,
  paginate = true,
  initialRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalRows,
  totalPages,
  showPaginationInfo = true,
  showRowsPerPageSelector = true,
}) {
  const hasActions = Array.isArray(actions) && actions.length > 0;

  const [internalPage, setInternalPage] = useState(1);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);

  const isExternal = typeof onPageChange === "function" && totalRows !== undefined && totalPages !== undefined;
  const currentPage = Number(page ?? internalPage) || 1;
  const currentRPP  = Number(rowsPerPage ?? internalRowsPerPage) || initialRowsPerPage;

  const totalR = isExternal ? Number(totalRows) || 0 : data.length;
  const totalP = paginate
    ? isExternal ? Math.max(1, Number(totalPages) || 1) : Math.max(1, Math.ceil(totalR / currentRPP))
    : 1;
  const safePage = Math.min(Math.max(1, currentPage), totalP);

  const thClass = compact ? S.thCompact : S.th;
  const tdBase  = compact ? S.tdCompact : S.td;

  useEffect(() => {
    if (!paginate || isExternal) return;
    const calc = Math.max(1, Math.ceil((data?.length || 0) / currentRPP));
    if (currentPage > calc) handlePageChange(calc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currentRPP, paginate, isExternal]);

  function handlePageChange(next) {
    const v = Math.min(Math.max(1, Number(next) || 1), totalP);
    if (onPageChange) { onPageChange(v); return; }
    setInternalPage(v);
  }

  function handleRPPChange(next) {
    const v = Number(next) || initialRowsPerPage;
    if (onRowsPerPageChange) onRowsPerPageChange(v); else setInternalRowsPerPage(v);
    if (onPageChange) onPageChange(1); else setInternalPage(1);
  }

  const paginatedData = useMemo(() => {
    if (!paginate || isExternal) return data;
    return data.slice((safePage - 1) * currentRPP, safePage * currentRPP);
  }, [data, paginate, safePage, currentRPP, isExternal]);

  const rangeStart = totalR === 0 ? 0 : paginate ? (safePage - 1) * currentRPP + 1 : 1;
  const rangeEnd   = totalR === 0 ? 0 : paginate ? Math.min(safePage * currentRPP, totalR) : totalR;

  function getAlignClass(align = "left") {
    if (align === "center") return "text-center";
    if (align === "right")  return "text-right";
    return "text-left";
  }

  return (
    <div className={`${S.wrapper} ${className}`}>
      <div className={S.inner}>
        {(title || description || helper) && (
          <div className={S.header}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                {title       && <h3 className={S.title}>{title}</h3>}
                {description && <p className={S.description}>{description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={S.badge}>
                  {loading ? "Cargando" : `${totalR} registro${totalR === 1 ? "" : "s"}`}
                </span>
                {paginate && <span className={S.badgePurple}>Página {safePage} de {totalP}</span>}
              </div>
            </div>
            {helper && (
              <div className={S.helperWrap}>
                <span className={S.helperStrong}>Uso: </span>
                <span className={S.helperText}>{helper}</span>
              </div>
            )}
          </div>
        )}

        <div className={tableWrapClassName}>
          {loading ? (
            <div className={S.loadingWrap}>
              <div className={S.loadingBox}>
                <span className="inline-flex items-end gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                </span>
                {loadingMessage}
              </div>
            </div>
          ) : totalR === 0 || data.length === 0 ? (
            <div className={S.emptyWrap}>
              <div className={S.emptyBox}>
                <Inbox size={22} className={S.emptyIcon} />
                <p className={S.emptyText}>{emptyText || emptyMessage}</p>
              </div>
            </div>
          ) : (
            <>
              <div className={S.scroll}>
                <table className={`${S.table} ${tableClassName}`}>
                  <thead>
                    <tr className={S.theadRow}>
                      {hasActions && actionsPosition === "left" && (
                        <th className={`${thClass} text-left ${actionsColumnClassName}`}>{actionsHeader}</th>
                      )}
                      {columns.map((col) => (
                        <th key={col.key} className={`${thClass} ${getAlignClass(col.align)} ${col.headerClassName || ""}`}>
                          {col.header}
                        </th>
                      ))}
                      {hasActions && actionsPosition === "right" && (
                        <th className={`${thClass} text-right ${actionsColumnClassName}`}>{actionsHeader}</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className={S.tbody}>
                    {paginatedData.map((item, index) => {
                      const rowKey = item?.[keyField] ?? index;
                      const absIndex = paginate ? (safePage - 1) * currentRPP + index : index;

                      return (
                        <tr key={rowKey} className={`${S.tr} ${S.trStriped} ${rowClassName}`}>
                          {hasActions && actionsPosition === "left" && (
                            <td className={`${tdBase} ${actionsColumnClassName}`}>
                              <div className={S.actionsWrapLeft}>{renderActions(actions, item, absIndex)}</div>
                            </td>
                          )}

                          {columns.map((col) => {
                            const value = col.render ? col.render(item, absIndex) : item?.[col.key];
                            const state = col.numeric ? S.tdNumeric : col.strong ? S.tdStrong : S.tdMuted;
                            return (
                              <td key={col.key} className={`${tdBase} ${state} ${getAlignClass(col.align)} ${col.className || ""}`}>
                                {value ?? "-"}
                              </td>
                            );
                          })}

                          {hasActions && actionsPosition === "right" && (
                            <td className={`${tdBase} text-right ${actionsColumnClassName}`}>
                              <div className={S.actionsWrapRight}>{renderActions(actions, item, absIndex)}</div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {paginate && totalR > 0 && (
                <div className={S.paginationWrap}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      {showPaginationInfo && (
                        <div className={S.paginationInfo}>
                          Mostrando{" "}
                          <span className="font-semibold text-gray-700">{rangeStart}</span> —{" "}
                          <span className="font-semibold text-gray-700">{rangeEnd}</span> de{" "}
                          <span className="font-semibold text-gray-700">{totalR}</span> registros
                        </div>
                      )}
                      {showRowsPerPageSelector && (
                        <div className="flex items-center gap-2">
                          <label className={S.paginationLabel}>Filas</label>
                          <select value={currentRPP} onChange={(e) => handleRPPChange(e.target.value)} className={S.paginationSelect}>
                            {rowsPerPageOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className={S.paginationButtonsWrap}>
                      <button type="button" onClick={() => handlePageChange(1)}         disabled={safePage <= 1 || loading} className={S.paginationButton}>«</button>
                      <button type="button" onClick={() => handlePageChange(safePage-1)} disabled={safePage <= 1 || loading} className={S.paginationButton}>Anterior</button>
                      <span className={S.paginationCurrent}>{safePage} / {totalP}</span>
                      <button type="button" onClick={() => handlePageChange(safePage+1)} disabled={safePage >= totalP || loading} className={S.paginationButton}>Siguiente</button>
                      <button type="button" onClick={() => handlePageChange(totalP)}     disabled={safePage >= totalP || loading} className={S.paginationButton}>»</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
