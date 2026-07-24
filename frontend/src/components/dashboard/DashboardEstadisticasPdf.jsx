import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─────────────────────────────────────────────
// Paleta — espeja la identidad del Sistema RAV
// ─────────────────────────────────────────────
const C = {
  dark:         "#0f172a",
  darkMid:      "#1e293b",
  orange:       "#f97316",
  orangeTint:   "#fff7ed",
  cyan:         "#0891b2",
  cyanTint:     "#ecfeff",
  green:        "#059669",
  greenTint:    "#f0fdf4",
  purple:       "#9333ea",
  purpleTint:   "#faf5ff",
  surface:      "#f8fafc",
  border:       "#e2e8f0",
  borderMid:    "#cbd5e1",
  text:         "#0f172a",
  textMid:      "#475569",
  textLight:    "#94a3b8",
  white:        "#ffffff",
  barTrack:     "#e2e8f0",
};

const styles = StyleSheet.create({
  // ── Página ──────────────────────────────────
  page: {
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
    fontSize: 9.5,
    color: C.text,
    fontFamily: "Helvetica",
    backgroundColor: C.white,
  },

  // ── Banda superior ──────────────────────────
  headerBand: {
    backgroundColor: C.dark,
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerBandLeft: {
    flexDirection: "column",
    gap: 2,
  },
  headerBandRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  brandLabel: {
    fontSize: 7.5,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginTop: 4,
  },
  docSubtitle: {
    fontSize: 9,
    color: C.textLight,
    marginTop: 3,
  },
  docClass: {
    fontSize: 7.5,
    color: C.orange,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  headerDate: {
    fontSize: 8.5,
    color: C.textLight,
    textAlign: "right",
  },

  // ── Cuerpo de página ────────────────────────
  pageBody: {
    paddingHorizontal: 32,
  },

  // ── Secciones ───────────────────────────────
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    letterSpacing: 0.3,
  },

  // ── KPI grid ────────────────────────────────
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
    border: `1 solid ${C.border}`,
  },
  kpiCardTop: {
    height: 3,
  },
  kpiCardBody: {
    padding: 10,
  },
  kpiCardLabel: {
    fontSize: 7.5,
    color: C.textMid,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
  },
  kpiCardValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
    marginBottom: 2,
  },
  kpiCardHelp: {
    fontSize: 7.5,
    color: C.textLight,
  },

  // ── Tabla base ──────────────────────────────
  table: {
    borderRadius: 5,
    border: `1 solid ${C.border}`,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.dark,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableHeaderCellRight: {
    fontSize: 8,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    width: 48,
    textAlign: "right",
  },
  tableHeaderCellBar: {
    width: 72,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
    borderBottom: `1 solid ${C.border}`,
  },
  tableRowAlt: {
    backgroundColor: C.surface,
  },
  tableCell: {
    fontSize: 9,
    color: C.text,
    flex: 1,
  },
  tableCellValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    width: 48,
    textAlign: "right",
  },
  tableCellBar: {
    width: 72,
    paddingLeft: 8,
  },
  emptyRow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 9,
    color: C.textLight,
    textAlign: "center",
  },

  // ── Tabla superficies ───────────────────────
  surfaceHeaderCell: {
    fontSize: 8,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  surfaceHeaderCellRight: {
    fontSize: 8,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    width: 40,
    textAlign: "right",
  },
  surfaceCell: {
    fontSize: 9,
    color: C.text,
    flex: 1,
  },
  surfaceCellValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    width: 40,
    textAlign: "right",
  },

  // ── Filtros grid ────────────────────────────
  filtrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filtroChip: {
    flexDirection: "row",
    gap: 0,
    borderRadius: 4,
    border: `1 solid ${C.border}`,
    overflow: "hidden",
  },
  filtroChipLabel: {
    backgroundColor: C.dark,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 7.5,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Helvetica-Bold",
  },
  filtroChipValue: {
    backgroundColor: C.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8.5,
    color: C.text,
  },

  // ── Responsable ─────────────────────────────
  responsableRow: {
    flexDirection: "row",
    gap: 10,
  },
  responsableItem: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 5,
    border: `1 solid ${C.border}`,
    padding: 9,
  },
  responsableLabel: {
    fontSize: 7.5,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  responsableValue: {
    fontSize: 9.5,
    color: C.text,
    fontFamily: "Helvetica-Bold",
  },

  // ── Interpretación ──────────────────────────
  interpretBox: {
    borderLeftWidth: 3,
    borderLeftColor: C.orange,
    borderLeftStyle: "solid",
    backgroundColor: C.orangeTint,
    padding: 12,
    borderRadius: 4,
  },
  interpretParagraph: {
    lineHeight: 1.55,
    marginBottom: 5,
    color: C.textMid,
    fontSize: 9.5,
  },
  interpretHighlight: {
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },

  // ── Nota metodológica ───────────────────────
  metodBox: {
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
    borderLeftStyle: "solid",
    backgroundColor: C.cyanTint,
    padding: 12,
    borderRadius: 4,
  },

  // ── Footer ──────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: C.textLight,
  },
  footerBrand: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.textMid,
  },

  // ── Divisor ─────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    marginBottom: 16,
  },
});

// ─── Utilidades ───────────────────────────────
function safeArray(v) { return Array.isArray(v) ? v : []; }
function fv(v) { return v == null || v === "" ? "—" : String(v); }
function maxOf(rows) {
  return safeArray(rows).reduce((m, r) => Math.max(m, Number(r.value ?? r.total ?? 0)), 0);
}

// ─── Mini barra proporcional ──────────────────
function MiniBar({ value, max, color }) {
  const filled = max > 0 ? Math.max(3, (Number(value) / max) * 60) : 0;
  return (
    <View style={{ width: 60, height: 6, backgroundColor: C.barTrack, borderRadius: 3 }}>
      <View style={{ width: filled, height: 6, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

// ─── Encabezado de página ─────────────────────
function PageHeader({ title, date, usuario }) {
  return (
    <View style={styles.headerBand} fixed>
      <View style={styles.headerBandLeft}>
        <Text style={styles.brandLabel}>Sistema RAV · Módulo estadístico</Text>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docSubtitle}>
          Informe de siniestros, factores, severidad y superficie
        </Text>
      </View>
      <View style={styles.headerBandRight}>
        <Text style={styles.docClass}>Documento estadístico</Text>
        <Text style={styles.headerDate}>{date}</Text>
        {usuario?.nombre || usuario?.usuario_nombre ? (
          <Text style={styles.headerDate}>
            {usuario?.nombre || usuario?.usuario_nombre}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Encabezado de sección ────────────────────
function SectionHeader({ label, color = C.orange }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionAccent, { backgroundColor: color }]} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

// ─── Tabla con mini barras ────────────────────
function TablaConBarras({ title, rows = [], labelHeader = "Categoría", accentColor = C.orange }) {
  const data = safeArray(rows);
  const max = maxOf(data);

  return (
    <View style={styles.section}>
      <SectionHeader label={title} color={accentColor} />
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeaderCell}>{labelHeader}</Text>
          <Text style={styles.tableHeaderCellRight}>Total</Text>
          <View style={styles.tableHeaderCellBar} />
        </View>

        {data.length ? (
          data.map((item, i) => (
            <View
              key={`${title}-${i}`}
              style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}
            >
              <Text style={styles.tableCell}>{fv(item.label)}</Text>
              <Text style={styles.tableCellValue}>{fv(item.value ?? item.total)}</Text>
              <View style={styles.tableCellBar}>
                <MiniBar value={item.value ?? item.total ?? 0} max={max} color={accentColor} />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Sin datos registrados</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Tabla de superficies ─────────────────────
function TablaSuperficies({ rows = [] }) {
  const data = safeArray(rows);

  return (
    <View style={styles.section}>
      <SectionHeader label="Superficie y condición vial" color={C.textMid} />
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.surfaceHeaderCell}>Superficie</Text>
          <Text style={styles.surfaceHeaderCell}>Estado</Text>
          <Text style={styles.surfaceHeaderCell}>Humedad</Text>
          <Text style={styles.surfaceHeaderCellRight}>Total</Text>
        </View>

        {data.length ? (
          data.map((item, i) => (
            <View
              key={`sup-${i}`}
              style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}
            >
              <Text style={styles.surfaceCell}>{fv(item.superficie)}</Text>
              <Text style={styles.surfaceCell}>{fv(item.estado)}</Text>
              <Text style={styles.surfaceCell}>{fv(item.humedad)}</Text>
              <Text style={styles.surfaceCellValue}>{fv(item.total)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Sin datos registrados</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── KPI Card ────────────────────────────────
function KpiCard({ label, value, helpText, accentColor, tintColor }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiCardTop, { backgroundColor: accentColor }]} />
      <View style={[styles.kpiCardBody, { backgroundColor: tintColor }]}>
        <Text style={styles.kpiCardLabel}>{label}</Text>
        <Text style={[styles.kpiCardValue, { color: accentColor }]}>
          {Number(value ?? 0).toLocaleString("es-AR")}
        </Text>
        {helpText ? (
          <Text style={styles.kpiCardHelp}>{helpText}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Filtros chips ────────────────────────────
function FiltrosAplicados({ filtros = {} }) {
  const items = [
    ["Provincia",       filtros.provincia       || "Todas"],
    ["Localidad",       filtros.localidad       || "Todas"],
    ["Tipo siniestro",  filtros.tipo_siniestro  || "Todos"],
    ["Año",             filtros.anio            || "Todos"],
    ["Mes",             filtros.mes             || "Todos"],
  ];

  return (
    <View style={styles.section}>
      <SectionHeader label="Filtros aplicados" color={C.cyan} />
      <View style={styles.filtrosGrid}>
        {items.map(([label, value]) => (
          <View key={label} style={styles.filtroChip}>
            <Text style={styles.filtroChipLabel}>{label}</Text>
            <Text style={styles.filtroChipValue}>{fv(value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Interpretación ───────────────────────────
function Interpretacion({ dashboard = {} }) {
  const tipo    = safeArray(dashboard.siniestrosTipo)[0];
  const sev     = safeArray(dashboard.severidad)[0];
  const veh     = safeArray(dashboard.vehiculosTipo)[0];
  const factor  = safeArray(dashboard.factoresHumanos)[0];

  return (
    <View style={styles.section}>
      <SectionHeader label="Interpretación pericial preliminar" color={C.orange} />
      <View style={styles.interpretBox}>
        <Text style={styles.interpretParagraph}>
          El presente informe resume indicadores estadísticos obtenidos a partir
          de los registros activos cargados en el Sistema RAV. La información
          permite observar tendencias generales sobre tipos de siniestro,
          severidad, vehículos intervinientes, factores humanos y condiciones
          de superficie.
        </Text>

        {tipo ? (
          <Text style={styles.interpretParagraph}>
            La categoría con mayor frecuencia registrada fue{" "}
            <Text style={styles.interpretHighlight}>"{tipo.label}"</Text>
            {`, con ${tipo.value} caso(s).`}
          </Text>
        ) : null}

        {sev ? (
          <Text style={styles.interpretParagraph}>
            En cuanto a severidad, predominó el estado{" "}
            <Text style={styles.interpretHighlight}>"{sev.label}"</Text>
            {`, con ${sev.value} registro(s).`}
          </Text>
        ) : null}

        {veh ? (
          <Text style={styles.interpretParagraph}>
            El tipo vehicular más frecuente fue{" "}
            <Text style={styles.interpretHighlight}>"{veh.label}"</Text>
            {`, con ${veh.value} intervención(es).`}
          </Text>
        ) : null}

        {factor ? (
          <Text style={styles.interpretParagraph}>
            El factor humano más observado fue{" "}
            <Text style={styles.interpretHighlight}>"{factor.label}"</Text>
            {`, con ${factor.value} registro(s).`}
          </Text>
        ) : null}

        <Text style={[styles.interpretParagraph, { marginBottom: 0 }]}>
          Estos resultados constituyen una lectura estadística preliminar y no
          sustituyen el análisis técnico individual de cada expediente.
        </Text>
      </View>
    </View>
  );
}

// ─── Footer ───────────────────────────────────
function PageFooter({ usuario }) {
  const nombre = usuario?.nombre || usuario?.usuario_nombre || "N/A";
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerBrand}>Sistema RAV</Text>
      <Text style={styles.footerText}>Responsable: {nombre}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Documento principal ─────────────────────
export default function DashboardEstadisticasPdf({
  dashboard = {},
  filtros = {},
  usuario = {},
  fechaEmision = new Date(),
}) {
  const kpis  = dashboard.kpis || {};
  const fecha = fechaEmision.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>

      {/* ══════════════ PÁGINA 1 ══════════════ */}
      <Page size="A4" style={styles.page}>
        <PageHeader title="Informe estadístico pericial" date={fecha} usuario={usuario} />

        <View style={styles.pageBody}>

          {/* Responsable */}
          <View style={styles.section}>
            <SectionHeader label="Responsable del informe" color={C.cyan} />
            <View style={styles.responsableRow}>
              <View style={styles.responsableItem}>
                <Text style={styles.responsableLabel}>Nombre</Text>
                <Text style={styles.responsableValue}>
                  {fv(usuario?.nombre || usuario?.usuario_nombre || usuario?.nombre_completo)}
                </Text>
              </View>
              <View style={styles.responsableItem}>
                <Text style={styles.responsableLabel}>Correo electrónico</Text>
                <Text style={styles.responsableValue}>
                  {fv(usuario?.correo || usuario?.usuario_correo || usuario?.email)}
                </Text>
              </View>
              <View style={styles.responsableItem}>
                <Text style={styles.responsableLabel}>Rol</Text>
                <Text style={styles.responsableValue}>
                  {fv(usuario?.rol || usuario?.rol_nombre)}
                </Text>
              </View>
            </View>
          </View>

          {/* KPIs */}
          <View style={styles.section}>
            <SectionHeader label="Indicadores generales" color={C.orange} />
            <View style={styles.kpiGrid}>
              <KpiCard
                label="Total de siniestros"
                value={kpis.totalSiniestros}
                helpText="Casos registrados activos"
                accentColor={C.orange}
                tintColor={C.orangeTint}
              />
              <KpiCard
                label="Total de personas"
                value={kpis.totalPersonas}
                helpText="Personas vinculadas"
                accentColor={C.cyan}
                tintColor={C.cyanTint}
              />
              <KpiCard
                label="Total de vehículos"
                value={kpis.totalVehiculos}
                helpText="Vehículos asociados"
                accentColor={C.green}
                tintColor={C.greenTint}
              />
            </View>
          </View>

          <FiltrosAplicados filtros={filtros} />

          <Interpretacion dashboard={dashboard} />

        </View>

        <PageFooter usuario={usuario} />
      </Page>

      {/* ══════════════ PÁGINA 2 ══════════════ */}
      <Page size="A4" style={styles.page}>
        <PageHeader title="Datos estadísticos" date={fecha} usuario={usuario} />

        <View style={styles.pageBody}>

          <TablaConBarras
            title="Siniestros por tipo"
            rows={dashboard.siniestrosTipo}
            labelHeader="Tipo de siniestro"
            accentColor={C.orange}
          />

          <TablaConBarras
            title="Severidad de personas involucradas"
            rows={dashboard.severidad}
            labelHeader="Estado lesivo"
            accentColor={C.purple}
          />

          <TablaConBarras
            title="Vehículos por tipo"
            rows={dashboard.vehiculosTipo}
            labelHeader="Tipo de vehículo"
            accentColor={C.green}
          />

          <TablaConBarras
            title="Factores humanos"
            rows={dashboard.factoresHumanos}
            labelHeader="Factor registrado"
            accentColor={C.cyan}
          />

        </View>

        <PageFooter usuario={usuario} />
      </Page>

      {/* ══════════════ PÁGINA 3 ══════════════ */}
      <Page size="A4" style={styles.page}>
        <PageHeader title="Superficie y metodología" date={fecha} usuario={usuario} />

        <View style={styles.pageBody}>

          <TablaSuperficies rows={dashboard.superficies} />

          <View style={styles.section}>
            <SectionHeader label="Nota metodológica" color={C.cyan} />
            <View style={styles.metodBox}>
              <Text style={styles.interpretParagraph}>
                Las estadísticas se obtienen a partir de los registros activos y
                datos asociados en el sistema. La calidad del resultado depende de
                la completitud y consistencia de la carga administrativa y técnica.
              </Text>
              <Text style={[styles.interpretParagraph, { marginBottom: 0 }]}>
                Los factores humanos, la severidad y la condición vial deben
                valorarse como insumos auxiliares para la interpretación pericial,
                complementándose con la inspección del lugar, evidencias físicas,
                cálculos técnicos y demás antecedentes del expediente.
              </Text>
            </View>
          </View>

        </View>

        <PageFooter usuario={usuario} />
      </Page>

    </Document>
  );
}
