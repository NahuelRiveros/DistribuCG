import { pdf } from "@react-pdf/renderer";
import DashboardEstadisticasPdf from "./DashboardEstadisticasPdf.jsx";

export async function exportDashboardPdf({
  dashboard,
  filtros,
  usuario,
  filename = "informe-estadistico-dashboard.pdf",
}) {
  const blob = await pdf(
    <DashboardEstadisticasPdf
      dashboard={dashboard}
      filtros={filtros}
      usuario={usuario}
      fechaEmision={new Date()}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}