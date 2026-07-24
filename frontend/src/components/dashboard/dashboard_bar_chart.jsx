import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

import DashboardChartCard from "./dashboard_chart_card.jsx";
import { UI_DASHBOARD } from "../styles_components/ui_dashboard_style.jsx";

function normalizarItems(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    label: item?.label ?? item?.superficie ?? "Sin dato",
    value: Number(item?.value ?? item?.total ?? 0),
  }));
}

function formatTick(value, max = 18) {
  const text = String(value ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function CustomTooltip({ active, payload, label, color }) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value ?? 0;

  return (
    <div className={UI_DASHBOARD.chartTooltip}>
      <div className={UI_DASHBOARD.chartTooltipLabel}>{label}</div>
      <div
        className={UI_DASHBOARD.chartTooltipValue}
        style={{ color }}
      >
        {Number(value).toLocaleString("es-AR")}
      </div>
    </div>
  );
}

// Gradient definition IDs are per-tone to avoid collisions between multiple charts.
function BarGradientDefs({ tone, color, isHorizontal }) {
  const id = `bar-grad-${tone}`;
  return (
    <defs>
      <linearGradient
        id={id}
        x1={isHorizontal ? "0" : "0"}
        y1={isHorizontal ? "0" : "0"}
        x2={isHorizontal ? "1" : "0"}
        y2={isHorizontal ? "0" : "1"}
      >
        <stop offset="0%" stopColor={color} stopOpacity={0.95} />
        <stop offset="100%" stopColor={color} stopOpacity={0.35} />
      </linearGradient>
    </defs>
  );
}

export default function DashboardBarChart({
  title,
  subtitle,
  items = [],
  tone = "cyan",
  layout = "vertical",
  dataKey = "value",
  xAxisAngle = 0,
  maxItems,
  emptyText = "Sin datos para graficar",
  badgeText,
  className = "",
}) {
  const normalizedItems = normalizarItems(items);
  const visibleItems =
    typeof maxItems === "number"
      ? normalizedItems.slice(0, maxItems)
      : normalizedItems;

  const color =
    UI_DASHBOARD.chartPalette[tone] || UI_DASHBOARD.chartPalette.cyan;

  const gradientId = `bar-grad-${tone}`;
  const isHorizontal = layout === "horizontal";

  const maxValue = visibleItems.reduce((m, i) => Math.max(m, i.value), 0);

  return (
    <DashboardChartCard
      title={title}
      subtitle={subtitle}
      badgeText={badgeText}
      empty={!visibleItems.length}
      emptyText={emptyText}
      tone={tone}
      className={className}
    >
      <div className="h-80 min-h-65 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleItems}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={
              isHorizontal
                ? { top: 4, right: 40, left: 10, bottom: 4 }
                : { top: 16, right: 8, left: 0, bottom: 35 }
            }
          >
            <BarGradientDefs tone={tone} color={color} isHorizontal={isHorizontal} />

            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              vertical={!isHorizontal}
              horizontal={isHorizontal}
              strokeDasharray="3 3"
            />

            {isHorizontal ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: "rgba(255,255,255,0.40)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  tickCount={5}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatTick(v, 18)}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={xAxisAngle}
                  textAnchor={xAxisAngle ? "end" : "middle"}
                  height={xAxisAngle ? 70 : 45}
                  tick={{ fill: "rgba(255,255,255,0.50)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  tickFormatter={(v) => formatTick(v, 14)}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
              </>
            )}

            <Tooltip
              content={<CustomTooltip color={color} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />

            <Bar
              dataKey={dataKey}
              radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
              barSize={isHorizontal ? 20 : 32}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {visibleItems.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${gradientId})`}
                  opacity={entry.value === maxValue ? 1 : 0.75}
                />
              ))}

              {!isHorizontal && (
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{
                    fill: color,
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.85,
                  }}
                  formatter={(v) => (v > 0 ? v : "")}
                />
              )}

              {isHorizontal && (
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{
                    fill: color,
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.85,
                  }}
                  formatter={(v) => (v > 0 ? v : "")}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}
