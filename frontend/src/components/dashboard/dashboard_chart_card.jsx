import { UI_DASHBOARD } from "../styles_components/ui_dashboard_style.jsx";

export default function DashboardChartCard({
  title,
  subtitle,
  badgeText,
  children,
  empty = false,
  emptyText = "Sin datos para graficar",
  tone = "cyan",
  className = "",
}) {
  const accentGrad =
    UI_DASHBOARD.chartToneAccent[tone] || UI_DASHBOARD.chartToneAccent.cyan;

  return (
    <div className={[UI_DASHBOARD.chartCard, className].join(" ")}>
      {/* tone accent line at top */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl"
        style={{ background: accentGrad }}
      />
      <div className={UI_DASHBOARD.chartGlow} />

      <div className={UI_DASHBOARD.chartContent}>
        {(title || subtitle || badgeText) && (
          <div className={UI_DASHBOARD.chartHeader}>
            <div>
              {title ? (
                <h3 className={UI_DASHBOARD.chartTitle}>
                  {title}
                </h3>
              ) : null}

              {subtitle ? (
                <p className={UI_DASHBOARD.chartSubtitle}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            {badgeText ? (
              <div className={UI_DASHBOARD.chartBadge}>
                {badgeText}
              </div>
            ) : null}
          </div>
        )}

        {empty ? (
          <div className={UI_DASHBOARD.chartEmpty}>
            {emptyText}
          </div>
        ) : (
          <div className={UI_DASHBOARD.chartWrap}>
            <div className={UI_DASHBOARD.chartInner}>
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}