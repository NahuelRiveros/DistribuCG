import { useState, useEffect } from "react";
import { UI_DASHBOARD } from "../styles_components/ui_dashboard_style.jsx";

// React.StrictMode runs effects twice on mount. Using prevRef caused the second
// run to see from===to and skip the animation. Animating always from 0 avoids
// the issue: each run sets display=0 then counts up, and cleanup cancels
// any in-progress interval so only the final run completes.
function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const to = Number(target) || 0;

    if (to === 0) {
      setDisplay(0);
      return;
    }

    setDisplay(0);

    const duration = 700;
    const totalFrames = 35;
    let frame = 0;

    const id = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);

      if (frame >= totalFrames) {
        setDisplay(to);
        clearInterval(id);
      } else {
        setDisplay(Math.round(to * eased));
      }
    }, duration / totalFrames);

    return () => clearInterval(id);
  }, [target]);

  return <>{display.toLocaleString("es-AR")}</>;
}

export default function DashboardKpiCard({
  label,
  value,
  helpText = "",
  tone = "cyan",
  badgeText,
  icon: Icon,
  className = "",
}) {
  const toneStyles = UI_DASHBOARD.kpiTone[tone] || UI_DASHBOARD.kpiTone.cyan;

  return (
    <article
      className={[
        UI_DASHBOARD.kpiCard,
        toneStyles.border,
        className,
      ].join(" ")}
    >
      {/* tone accent line at top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[26px]"
        style={{ background: toneStyles.lineGrad }}
      />

      <div
        className={[
          UI_DASHBOARD.kpiGlow,
          toneStyles.glow,
        ].join(" ")}
      />

      <div className={UI_DASHBOARD.kpiContent}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={UI_DASHBOARD.kpiLabel}>{label}</div>
            {badgeText ? (
              <span
                className={[
                  UI_DASHBOARD.kpiChip,
                  toneStyles.chip,
                  "mt-1.5",
                ].join(" ")}
              >
                {badgeText}
              </span>
            ) : null}
          </div>

          {Icon && (
            <div
              className={[
                "shrink-0 flex h-10 w-10 items-center justify-center rounded-full",
                toneStyles.value,
              ].join(" ")}
              style={{ background: toneStyles.iconBg }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
        </div>

        <div
          className={[
            UI_DASHBOARD.kpiValue,
            toneStyles.value,
          ].join(" ")}
        >
          <AnimatedNumber target={value} />
        </div>

        {helpText ? (
          <p className={UI_DASHBOARD.kpiHelp}>{helpText}</p>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </article>
  );
}
