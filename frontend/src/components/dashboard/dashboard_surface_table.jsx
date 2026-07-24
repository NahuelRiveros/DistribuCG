import { UI_DASHBOARD } from "../styles_components/ui_dashboard_style.jsx";

export default function DashboardSurfaceTable({
  title = "Superficies",
  subtitle = "Distribución según superficie, estado y humedad",
  items = [],
  emptyText = "No hay superficies registradas para los filtros aplicados",
  className = "",
}) {
  const normalizedItems = (Array.isArray(items) ? items : []).map((item) => ({
    superficie: item?.superficie ?? "Sin dato",
    estado: item?.estado ?? "Sin dato",
    humedad: item?.humedad ?? "Sin dato",
    total: Number(item?.total ?? item?.value ?? 0),
  }));

  return (
    <div className={[UI_DASHBOARD.block, className].join(" ")}>
      <div className={UI_DASHBOARD.blockGlow} />

      <div className={UI_DASHBOARD.blockContent}>
        <div className={UI_DASHBOARD.blockHeader}>
          <div>
            <h3 className={UI_DASHBOARD.blockTitle}>{title}</h3>
            {subtitle ? (
              <p className={UI_DASHBOARD.blockSubtitle}>{subtitle}</p>
            ) : null}
          </div>

          <div className={UI_DASHBOARD.blockBadge}>
            {normalizedItems.length} registro{normalizedItems.length === 1 ? "" : "s"}
          </div>
        </div>

        {!normalizedItems.length ? (
          <div className={UI_DASHBOARD.emptyBox}>{emptyText}</div>
        ) : (
          <>
            <div className={`hidden md:grid ${UI_DASHBOARD.simpleTableHeader}`}>
              <div>Superficie</div>
              <div>Estado</div>
              <div>Humedad</div>
              <div className="text-right">Total</div>
            </div>

            <div className={UI_DASHBOARD.simpleTableWrap}>
              <div className="divide-y divide-white/5">
                {normalizedItems.map((item, index) => (
                  <div key={`${item.superficie}-${item.estado}-${item.humedad}-${index}`}>
                    <div className={`hidden md:grid ${UI_DASHBOARD.simpleTableRow}`}>
                      <div className="truncate">{item.superficie}</div>
                      <div className="truncate">{item.estado}</div>
                      <div className="truncate">{item.humedad}</div>
                      <div className={UI_DASHBOARD.simpleTableCellValue}>
                        {item.total}
                      </div>
                    </div>

                    <div className="space-y-2 px-4 py-4 md:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">
                          {item.superficie}
                        </span>
                        <span className={UI_DASHBOARD.badge.info}>
                          {item.total}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={UI_DASHBOARD.badge.neutral}>
                          Estado: {item.estado}
                        </span>
                        <span className={UI_DASHBOARD.badge.neutral}>
                          Humedad: {item.humedad}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}