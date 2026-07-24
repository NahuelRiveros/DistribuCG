import { UI_DASHBOARD } from "../styles_components/ui_dashboard_style.jsx";

function getMaxValue(items = []) {
  return items.reduce((acc, item) => {
    const value = Number(item?.value ?? item?.total ?? 0);
    return value > acc ? value : acc;
  }, 0);
}

export default function DashboardBarList({
  title,
  subtitle,
  items = [],
  tone = "cyan",
  emptyText = "Sin datos para mostrar",
  valueSuffix = "",
  className = "",
  maxItems,
}) {
  const toneClass =
    UI_DASHBOARD.progressTone[tone] || UI_DASHBOARD.progressTone.cyan;

  const accentGrad =
    UI_DASHBOARD.chartToneAccent[tone] || UI_DASHBOARD.chartToneAccent.cyan;

  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      label: item?.label ?? item?.superficie ?? "Sin dato",
      value: Number(item?.value ?? item?.total ?? 0),
    }))
    .filter((item) => item.label);

  const visibleItems =
    typeof maxItems === "number"
      ? normalizedItems.slice(0, maxItems)
      : normalizedItems;

  const max = getMaxValue(visibleItems);

  return (
    <div className={[UI_DASHBOARD.block, className].join(" ")}>
      {/* tone accent line at top */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl"
        style={{ background: accentGrad }}
      />
      <div className={UI_DASHBOARD.blockGlow} />

      <div className={UI_DASHBOARD.blockContent}>
        {(title || subtitle) && (
          <div className={UI_DASHBOARD.blockHeader}>
            <div>
              {title ? (
                <h3 className={UI_DASHBOARD.blockTitle}>
                  {title}
                </h3>
              ) : null}

              {subtitle ? (
                <p className={UI_DASHBOARD.blockSubtitle}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {!visibleItems.length ? (
          <div className={UI_DASHBOARD.emptyBox}>
            {emptyText}
          </div>
        ) : (
          <div className={UI_DASHBOARD.listWrap}>
            {visibleItems.map((item, index) => {
              const width =
                max > 0 ? Math.max(6, (item.value / max) * 100) : 0;

              return (
                <div
                  key={`${item.label}-${index}`}
                  className={UI_DASHBOARD.listItem}
                >
                  <div className={UI_DASHBOARD.listRow}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={UI_DASHBOARD.listRank}>
                        {index + 1}
                      </span>
                      <span className={UI_DASHBOARD.listLabel}>
                        {item.label}
                      </span>
                    </div>

                    <span className={UI_DASHBOARD.listValue}>
                      {item.value}
                      {valueSuffix}
                    </span>
                  </div>

                  <div className={UI_DASHBOARD.progressTrack}>
                    <div
                      className={[
                        UI_DASHBOARD.progressBarBase,
                        toneClass,
                      ].join(" ")}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}