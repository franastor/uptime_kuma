import * as XLSX from "xlsx-js-style";

import type {
  AnalyticsSummary,
  MonitorAnalytics,
  SlaStatus,
} from "@/src/modules/analytics/types/analytics";
import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import type { ResolvedLocale } from "@/src/shared/i18n";
import {
  buildExportTimestamp,
  slugifyFilenamePart,
} from "@/src/modules/export/utils/csv";

const COLORS = {
  background: "FF07110D",
  surface: "FF0D1F17",
  surfaceElevated: "FF132A20",
  primary: "FF5CDD8B",
  teal: "FF2EC4B6",
  text: "FFF5FFF8",
  textDark: "FF07110D",
  textMuted: "FFA7B8AD",
  border: "FF1E3A2B",
  warning: "FFF5C451",
  danger: "FFF06464",
  info: "FF5FA8FF",
  white: "FFFFFFFF",
} as const;

type Cell = XLSX.CellObject & {
  s?: Record<string, unknown>;
};

type Copy = {
  reportTitle: string;
  generated: string;
  server: string;
  period: string;
  from: string;
  to: string;
  limitedHistory: string;
  yes: string;
  no: string;
  unknown: string;
  sheets: {
    summary: string;
    monitors: string;
    trends: string;
    slaSsl: string;
    heatmap: string;
    events: string;
  };
};

const COPY: Record<ResolvedLocale, Copy> = {
  es: {
    reportTitle: "Informe Premium KumaPulse",
    generated: "Generado",
    server: "Servidor",
    period: "Periodo",
    from: "Desde",
    to: "Hasta",
    limitedHistory:
      "Aviso: parte de las métricas se estima con histórico local incompleto.",
    yes: "Sí",
    no: "No",
    unknown: "Sin datos",
    sheets: {
      summary: "Resumen",
      monitors: "Monitores",
      trends: "Tendencias",
      slaSsl: "SLA y SSL",
      heatmap: "Heatmap",
      events: "Eventos",
    },
  },
  en: {
    reportTitle: "KumaPulse Premium report",
    generated: "Generated",
    server: "Server",
    period: "Period",
    from: "From",
    to: "To",
    limitedHistory:
      "Notice: some metrics are estimated from incomplete local history.",
    yes: "Yes",
    no: "No",
    unknown: "No data",
    sheets: {
      summary: "Summary",
      monitors: "Monitors",
      trends: "Trends",
      slaSsl: "SLA and SSL",
      heatmap: "Heatmap",
      events: "Events",
    },
  },
};

function titleStyle(): Record<string, unknown> {
  return {
    fill: {
      patternType: "solid",
      fgColor: { rgb: COLORS.background },
    },
    font: {
      bold: true,
      color: { rgb: COLORS.text },
      sz: 20,
    },
    alignment: {
      vertical: "center",
      horizontal: "left",
    },
  };
}

function sectionStyle(): Record<string, unknown> {
  return {
    fill: {
      patternType: "solid",
      fgColor: { rgb: COLORS.surfaceElevated },
    },
    font: {
      bold: true,
      color: { rgb: COLORS.primary },
      sz: 12,
    },
    alignment: { vertical: "center" },
  };
}

function headerStyle(): Record<string, unknown> {
  return {
    fill: {
      patternType: "solid",
      fgColor: { rgb: COLORS.surface },
    },
    font: {
      bold: true,
      color: { rgb: COLORS.text },
    },
    border: {
      bottom: {
        style: "thin",
        color: { rgb: COLORS.primary },
      },
    },
    alignment: {
      vertical: "center",
      wrapText: true,
    },
  };
}

function statusFill(
  value: string,
): Record<string, unknown> {
  const normalized = value.toLowerCase();
  const color =
    normalized.includes("incumpl") ||
    normalized.includes("breach") ||
    normalized === "down" ||
    normalized.includes("critical")
      ? COLORS.danger
      : normalized.includes("riesgo") ||
          normalized.includes("risk") ||
          normalized.includes("warning")
        ? COLORS.warning
        : normalized === "up" ||
            normalized.includes("cumpl") ||
            normalized.includes("met") ||
            normalized.includes("improving")
          ? COLORS.primary
          : COLORS.info;

  return {
    fill: {
      patternType: "solid",
      fgColor: { rgb: color },
    },
    font: {
      bold: true,
      color: { rgb: COLORS.textDark },
    },
  };
}

function getCell(
  sheet: XLSX.WorkSheet,
  address: string,
): Cell {
  if (!sheet[address]) {
    sheet[address] = {
      t: "s",
      v: "",
    } as Cell;
  }

  return sheet[address] as Cell;
}

function styleRange(
  sheet: XLSX.WorkSheet,
  range: string,
  style: Record<string, unknown>,
): void {
  const decoded = XLSX.utils.decode_range(range);

  for (let row = decoded.s.r; row <= decoded.e.r; row += 1) {
    for (
      let column = decoded.s.c;
      column <= decoded.e.c;
      column += 1
    ) {
      const address = XLSX.utils.encode_cell({
        r: row,
        c: column,
      });
      getCell(sheet, address).s = style;
    }
  }
}

function setTitle(
  sheet: XLSX.WorkSheet,
  title: string,
  lastColumn: number,
): void {
  const end = XLSX.utils.encode_col(lastColumn);
  sheet["!merges"] = [
    ...(sheet["!merges"] ?? []),
    XLSX.utils.decode_range(`A1:${end}2`),
  ];
  getCell(sheet, "A1").v = title;
  getCell(sheet, "A1").t = "s";
  styleRange(sheet, `A1:${end}2`, titleStyle());
  sheet["!rows"] = [
    { hpt: 25 },
    { hpt: 12 },
    ...(sheet["!rows"]?.slice(2) ?? []),
  ];
}

function styleHeaderRow(
  sheet: XLSX.WorkSheet,
  row: number,
  lastColumn: number,
): void {
  styleRange(
    sheet,
    `A${row}:${XLSX.utils.encode_col(lastColumn)}${row}`,
    headerStyle(),
  );
}

function addSection(
  sheet: XLSX.WorkSheet,
  row: number,
  title: string,
  startColumn = 0,
  endColumn = 1,
): void {
  const start = XLSX.utils.encode_col(startColumn);
  const end = XLSX.utils.encode_col(endColumn);
  sheet["!merges"] = [
    ...(sheet["!merges"] ?? []),
    XLSX.utils.decode_range(
      `${start}${row}:${end}${row}`,
    ),
  ];
  getCell(sheet, `${start}${row}`).v = title;
  styleRange(
    sheet,
    `${start}${row}:${end}${row}`,
    sectionStyle(),
  );
}

function formatDurationMinutes(
  valueMs: number | null,
): number | null {
  if (
    valueMs === null ||
    !Number.isFinite(valueMs)
  ) {
    return null;
  }

  return valueMs / 60_000;
}

function formatDurationHours(
  valueMs: number | null,
): number | null {
  if (
    valueMs === null ||
    !Number.isFinite(valueMs)
  ) {
    return null;
  }

  return valueMs / 3_600_000;
}

function statusLabel(
  value: SlaStatus,
  locale: ResolvedLocale,
): string {
  const labels: Record<
    ResolvedLocale,
    Record<SlaStatus, string>
  > = {
    es: {
      met: "Cumplido",
      at_risk: "En riesgo",
      breached: "Incumplido",
      unknown: "Sin datos",
    },
    en: {
      met: "Met",
      at_risk: "At risk",
      breached: "Breached",
      unknown: "No data",
    },
  };

  return labels[locale][value];
}

function uptimeBar(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const total = 20;
  const filled = Math.max(
    0,
    Math.min(total, Math.round(value * total)),
  );
  return `${"█".repeat(filled)}${"░".repeat(
    total - filled,
  )}`;
}

function styleDataSheet(
  sheet: XLSX.WorkSheet,
  headerRow: number,
  lastColumn: number,
  lastRow: number,
): void {
  styleHeaderRow(sheet, headerRow, lastColumn);
  sheet["!autofilter"] = {
    ref: `A${headerRow}:${XLSX.utils.encode_col(
      lastColumn,
    )}${lastRow}`,
  };
  sheet["!freeze"] = {
    xSplit: 0,
    ySplit: headerRow,
    topLeftCell: `A${headerRow + 1}`,
    activePane: "bottomLeft",
    state: "frozen",
  } as XLSX.WorkSheet["!freeze"];
}

function createAnalyticsSummarySheet(
  summary: AnalyticsSummary,
  serverName: string,
  locale: ResolvedLocale,
): XLSX.WorkSheet {
  const c = COPY[locale];
  const rows: (string | number | null)[][] = [
    [],
    [],
    [],
    [c.server, serverName],
    [c.period, summary.window],
    [
      c.from,
      new Date(summary.windowStart).toLocaleString(
        locale,
      ),
    ],
    [
      c.to,
      new Date(summary.windowEnd).toLocaleString(
        locale,
      ),
    ],
    [c.generated, new Date().toLocaleString(locale)],
    [],
    [],
    ["Health Score", summary.healthScore],
    [
      locale === "es"
        ? "Disponibilidad media"
        : "Average availability",
      summary.averageUptime,
    ],
    [
      locale === "es"
        ? "Downtime total (min)"
        : "Total downtime (min)",
      formatDurationMinutes(summary.totalDowntimeMs),
    ],
    [
      locale === "es"
        ? "Incidencias"
        : "Incidents",
      summary.totalIncidents,
    ],
    [
      locale === "es"
        ? "Latencia media (ms)"
        : "Average latency (ms)",
      summary.averagePing,
    ],
    [
      "P95 (ms)",
      summary.latency.p95Ms,
    ],
    [
      locale === "es" ? "MTTR (min)" : "MTTR (min)",
      formatDurationMinutes(summary.mttrMs),
    ],
    [
      locale === "es" ? "MTBF (h)" : "MTBF (h)",
      formatDurationHours(summary.mtbfMs),
    ],
    [
      locale === "es" ? "Estado SLA" : "SLA status",
      statusLabel(summary.slaStatus, locale),
    ],
    [],
    [],
    [
      locale === "es" ? "Estado" : "Status",
      locale === "es" ? "Monitores" : "Monitors",
      locale === "es" ? "Distribución" : "Distribution",
    ],
    [
      "UP",
      summary.statusDistribution.up,
      uptimeBar(
        summary.statusDistribution.total > 0
          ? summary.statusDistribution.up /
              summary.statusDistribution.total
          : null,
      ),
    ],
    [
      "DOWN",
      summary.statusDistribution.down,
      uptimeBar(
        summary.statusDistribution.total > 0
          ? summary.statusDistribution.down /
              summary.statusDistribution.total
          : null,
      ),
    ],
    [
      locale === "es" ? "Pausados" : "Paused",
      summary.statusDistribution.paused,
      uptimeBar(
        summary.statusDistribution.total > 0
          ? summary.statusDistribution.paused /
              summary.statusDistribution.total
          : null,
      ),
    ],
    [],
    [],
    [
      locale === "es" ? "Comparativa" : "Comparison",
      locale === "es" ? "Actual" : "Current",
      locale === "es" ? "Anterior" : "Previous",
      "Δ",
    ],
    [
      "Uptime",
      summary.averageUptime,
      summary.comparative.previousUptime,
      summary.comparative.uptimeDelta,
    ],
    [
      locale === "es" ? "Incidencias" : "Incidents",
      summary.totalIncidents,
      summary.comparative.previousIncidents,
      summary.comparative.incidentsDelta,
    ],
    [
      locale === "es"
        ? "Latencia (ms)"
        : "Latency (ms)",
      summary.averagePing,
      summary.comparative.previousPingMs,
      summary.comparative.pingDeltaMs,
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  setTitle(
    sheet,
    `${c.reportTitle} · ${serverName}`,
    5,
  );
  addSection(
    sheet,
    10,
    locale === "es"
      ? "Resumen ejecutivo"
      : "Executive summary",
    0,
    1,
  );
  addSection(
    sheet,
    21,
    locale === "es"
      ? "Distribución de estados"
      : "Status distribution",
    0,
    2,
  );
  addSection(
    sheet,
    27,
    locale === "es"
      ? "Comparación con el periodo anterior"
      : "Previous period comparison",
    0,
    3,
  );
  styleHeaderRow(sheet, 22, 2);
  styleHeaderRow(sheet, 28, 3);

  getCell(sheet, "B12").z = "0.00%";
  getCell(sheet, "B19").s = statusFill(
    String(getCell(sheet, "B19").v),
  );
  getCell(sheet, "B29").z = "0.00%";
  getCell(sheet, "C29").z = "0.00%";
  getCell(sheet, "D29").z = "0.00%";

  if (summary.hasLimitedHistory) {
    getCell(sheet, "A34").v = c.limitedHistory;
    getCell(sheet, "A34").s = {
      font: {
        italic: true,
        color: { rgb: COLORS.warning },
      },
    };
    sheet["!merges"] = [
      ...(sheet["!merges"] ?? []),
      XLSX.utils.decode_range("A34:F34"),
    ];
  }

  sheet["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 3 },
    { wch: 3 },
  ];

  return sheet;
}

function createMonitorsSheet(
  monitors: MonitorAnalytics[],
  locale: ResolvedLocale,
): XLSX.WorkSheet {
  const headers =
    locale === "es"
      ? [
          "Ranking",
          "Monitor",
          "Estado",
          "Uptime",
          "Disponibilidad",
          "Fuente uptime",
          "Downtime (min)",
          "Incidencias",
          "MTTR (min)",
          "MTBF (h)",
          "Ping medio (ms)",
          "Pico (ms)",
          "P95 (ms)",
          "Estado SLA",
          "Objetivo SLA",
          "Días certificado",
          "Certificado válido",
        ]
      : [
          "Rank",
          "Monitor",
          "Status",
          "Uptime",
          "Availability",
          "Uptime source",
          "Downtime (min)",
          "Incidents",
          "MTTR (min)",
          "MTBF (h)",
          "Average ping (ms)",
          "Peak (ms)",
          "P95 (ms)",
          "SLA status",
          "SLA target",
          "Certificate days",
          "Certificate valid",
        ];

  const sorted = [...monitors].sort(
    (a, b) =>
      b.downtimeMs - a.downtimeMs ||
      b.incidents - a.incidents ||
      a.monitorName.localeCompare(b.monitorName),
  );

  const rows = sorted.map((monitor, index) => [
    index + 1,
    monitor.monitorName,
    monitor.status.toUpperCase(),
    monitor.uptime,
    uptimeBar(monitor.uptime),
    monitor.uptimeSource ?? "",
    formatDurationMinutes(monitor.downtimeMs),
    monitor.incidents,
    formatDurationMinutes(monitor.mttrMs),
    formatDurationHours(monitor.mtbfMs),
    monitor.averagePing,
    monitor.peakPing,
    monitor.p95Ping,
    statusLabel(monitor.slaStatus, locale),
    monitor.slaTarget,
    monitor.certificateDaysRemaining,
    monitor.certificateValid === null
      ? COPY[locale].unknown
      : monitor.certificateValid
        ? COPY[locale].yes
        : COPY[locale].no,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    [],
    [],
    [],
    headers,
    ...rows,
  ]);
  setTitle(
    sheet,
    locale === "es"
      ? "Monitores y ranking de estabilidad"
      : "Monitors and stability ranking",
    headers.length - 1,
  );
  styleDataSheet(
    sheet,
    4,
    headers.length - 1,
    rows.length + 4,
  );

  for (let row = 5; row <= rows.length + 4; row += 1) {
    getCell(sheet, `D${row}`).z = "0.00%";
    getCell(sheet, `O${row}`).z = "0.00%";
    getCell(sheet, `C${row}`).s = statusFill(
      String(getCell(sheet, `C${row}`).v),
    );
    getCell(sheet, `N${row}`).s = statusFill(
      String(getCell(sheet, `N${row}`).v),
    );
    getCell(sheet, `E${row}`).s = {
      font: {
        name: "Consolas",
        color: { rgb: COLORS.primary },
      },
    };
  }

  sheet["!cols"] = [
    { wch: 9 },
    { wch: 32 },
    { wch: 13 },
    { wch: 12 },
    { wch: 23 },
    { wch: 15 },
    { wch: 16 },
    { wch: 12 },
    { wch: 13 },
    { wch: 12 },
    { wch: 17 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
  ];

  return sheet;
}

function createTrendsSheet(
  summary: AnalyticsSummary,
  locale: ResolvedLocale,
): XLSX.WorkSheet {
  const headers =
    locale === "es"
      ? ["Métrica", "Dirección", "Señal", "Detalle", "Δ"]
      : ["Metric", "Direction", "Signal", "Detail", "Δ"];
  const rows = summary.trends.map((trend) => [
    trend.metric,
    trend.direction,
    trend.label,
    trend.detail,
    trend.deltaLabel,
  ]);

  const insightHeaders =
    locale === "es"
      ? [
          "Severidad",
          "Categoría",
          "Monitor",
          "Título",
          "Descripción",
        ]
      : [
          "Severity",
          "Category",
          "Monitor",
          "Title",
          "Description",
        ];
  const startInsights = rows.length + 7;
  const data: (string | number | null)[][] = [
    [],
    [],
    [],
    headers,
    ...rows,
    [],
    [],
    insightHeaders,
    ...summary.insights.map((insight) => [
      insight.severity,
      insight.category,
      insight.monitorName ?? "",
      insight.title,
      insight.description,
    ]),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(data);
  setTitle(
    sheet,
    locale === "es"
      ? "Tendencias e insights"
      : "Trends and insights",
    4,
  );
  styleHeaderRow(sheet, 4, 4);
  styleHeaderRow(sheet, startInsights, 4);

  for (let row = 5; row <= rows.length + 4; row += 1) {
    getCell(sheet, `B${row}`).s = statusFill(
      String(getCell(sheet, `B${row}`).v),
    );
  }

  for (
    let row = startInsights + 1;
    row <= startInsights + summary.insights.length;
    row += 1
  ) {
    getCell(sheet, `A${row}`).s = statusFill(
      String(getCell(sheet, `A${row}`).v),
    );
  }

  sheet["!cols"] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 65 },
    { wch: 20 },
  ];

  return sheet;
}

function createSlaSslSheet(
  summary: AnalyticsSummary,
  locale: ResolvedLocale,
): XLSX.WorkSheet {
  const slaHeaders =
    locale === "es"
      ? [
          "Monitor",
          "Uptime SLA",
          "Objetivo",
          "Estado",
          "Downtime (min)",
          "Incidencias",
        ]
      : [
          "Monitor",
          "SLA uptime",
          "Target",
          "Status",
          "Downtime (min)",
          "Incidents",
        ];
  const slaRows = summary.monitorsBelowSla.map(
    (monitor) => [
      monitor.monitorName,
      monitor.slaUptime,
      monitor.slaTarget,
      statusLabel(monitor.slaStatus, locale),
      formatDurationMinutes(monitor.downtimeMs),
      monitor.incidents,
    ],
  );
  const sslStart = slaRows.length + 7;
  const sslHeaders =
    locale === "es"
      ? ["Monitor", "Días restantes", "Válido", "Estado"]
      : ["Monitor", "Days remaining", "Valid", "Status"];
  const sslRows = summary.sslCertificates.map(
    (certificate) => [
      certificate.monitorName,
      certificate.daysRemaining,
      certificate.valid === null
        ? COPY[locale].unknown
        : certificate.valid
          ? COPY[locale].yes
          : COPY[locale].no,
      certificate.valid === false
        ? locale === "es"
          ? "Inválido"
          : "Invalid"
        : certificate.daysRemaining === null
          ? COPY[locale].unknown
          : certificate.daysRemaining <= 7
            ? locale === "es"
              ? "Crítico"
              : "Critical"
            : certificate.daysRemaining <= 30
              ? locale === "es"
                ? "Próximo"
                : "Expiring"
              : "OK",
    ],
  );

  const sheet = XLSX.utils.aoa_to_sheet([
    [],
    [],
    [],
    slaHeaders,
    ...slaRows,
    [],
    [],
    sslHeaders,
    ...sslRows,
  ]);
  setTitle(
    sheet,
    locale === "es"
      ? "Cumplimiento SLA y certificados SSL"
      : "SLA compliance and SSL certificates",
    5,
  );
  styleHeaderRow(sheet, 4, 5);
  styleHeaderRow(sheet, sslStart, 3);

  for (let row = 5; row <= slaRows.length + 4; row += 1) {
    getCell(sheet, `B${row}`).z = "0.00%";
    getCell(sheet, `C${row}`).z = "0.00%";
    getCell(sheet, `D${row}`).s = statusFill(
      String(getCell(sheet, `D${row}`).v),
    );
  }

  for (
    let row = sslStart + 1;
    row <= sslStart + sslRows.length;
    row += 1
  ) {
    getCell(sheet, `D${row}`).s = statusFill(
      String(getCell(sheet, `D${row}`).v),
    );
  }

  sheet["!cols"] = [
    { wch: 34 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
  ];

  return sheet;
}

function createHeatmapSheet(
  summary: AnalyticsSummary,
  locale: ResolvedLocale,
): XLSX.WorkSheet {
  const weekdays =
    locale === "es"
      ? [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
        ]
      : [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
  const values = new Map(
    summary.heatmap.map((cell) => [
      `${cell.dayOfWeek}:${cell.hour}`,
      cell.downtimeMs / 60_000,
    ]),
  );
  const matrix = weekdays.map((day, dayIndex) => [
    day,
    ...Array.from({ length: 24 }, (_, hour) => {
      const value = values.get(`${dayIndex}:${hour}`);
      return value && value > 0 ? value : null;
    }),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([
    [],
    [],
    [],
    [
      locale === "es" ? "Día / hora" : "Day / hour",
      ...Array.from(
        { length: 24 },
        (_, hour) => `${String(hour).padStart(2, "0")}:00`,
      ),
    ],
    ...matrix,
  ]);
  setTitle(
    sheet,
    locale === "es"
      ? "Heatmap de downtime (minutos)"
      : "Downtime heatmap (minutes)",
    24,
  );
  styleHeaderRow(sheet, 4, 24);

  const maxValue = Math.max(
    0,
    ...summary.heatmap.map(
      (cell) => cell.downtimeMs / 60_000,
    ),
  );

  for (let row = 5; row <= 11; row += 1) {
    getCell(sheet, `A${row}`).s = headerStyle();

    for (let column = 1; column <= 24; column += 1) {
      const address = XLSX.utils.encode_cell({
        r: row - 1,
        c: column,
      });
      const cell = getCell(sheet, address);
      const value =
        typeof cell.v === "number" ? cell.v : 0;
      const ratio =
        maxValue > 0 ? value / maxValue : 0;
      const color =
        value <= 0
          ? COLORS.surface
          : ratio >= 0.66
            ? COLORS.danger
            : ratio >= 0.33
              ? COLORS.warning
              : COLORS.primary;
      cell.s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: color },
        },
        font: {
          color: {
            rgb:
              value <= 0
                ? COLORS.textMuted
                : COLORS.textDark,
          },
        },
        alignment: {
          horizontal: "center",
        },
      };
      if (value <= 0) {
        cell.v = "·";
        cell.t = "s";
      }
    }
  }

  sheet["!cols"] = [
    { wch: 14 },
    ...Array.from({ length: 24 }, () => ({
      wch: 7,
    })),
  ];

  return sheet;
}

export function buildAnalyticsExcel(input: {
  summary: AnalyticsSummary;
  serverName: string;
  locale: ResolvedLocale;
}): string {
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `${COPY[input.locale].reportTitle} · ${input.serverName}`,
    Subject: "Uptime Kuma analytics",
    Author: "KumaPulse",
    Company: "KumaPulse",
    CreatedDate: new Date(),
  };

  XLSX.utils.book_append_sheet(
    workbook,
    createAnalyticsSummarySheet(
      input.summary,
      input.serverName,
      input.locale,
    ),
    COPY[input.locale].sheets.summary,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createMonitorsSheet(
      input.summary.monitors,
      input.locale,
    ),
    COPY[input.locale].sheets.monitors,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createTrendsSheet(input.summary, input.locale),
    COPY[input.locale].sheets.trends,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createSlaSslSheet(input.summary, input.locale),
    COPY[input.locale].sheets.slaSsl,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    createHeatmapSheet(input.summary, input.locale),
    COPY[input.locale].sheets.heatmap,
  );

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
    compression: true,
  }) as string;
}

export function buildAnalyticsExcelFilename(input: {
  serverName: string;
  window: string;
  now?: number;
}): string {
  const stamp = buildExportTimestamp(input.now);
  const server = slugifyFilenamePart(input.serverName);
  return `kumapulse-informe-${server}-${input.window}-${stamp}.xlsx`;
}

export function buildTimelineExcel(input: {
  events: TimelineEvent[];
  serverName: string;
  locale: ResolvedLocale;
}): string {
  const { events, locale } = input;
  const c = COPY[locale];
  const workbook = XLSX.utils.book_new();
  const important = events.filter(
    (event) => event.important,
  ).length;
  const statusChanges = events.filter(
    (event) => event.type === "status_change",
  ).length;
  const pings = events
    .map((event) => event.ping)
    .filter((ping): ping is number => ping !== null);
  const averagePing =
    pings.length > 0
      ? pings.reduce((total, ping) => total + ping, 0) /
        pings.length
      : null;
  const byMonitor = new Map<
    string,
    {
      events: number;
      incidents: number;
      pings: number[];
    }
  >();

  for (const event of events) {
    const current = byMonitor.get(event.monitorName) ?? {
      events: 0,
      incidents: 0,
      pings: [],
    };
    current.events += 1;
    if (
      event.type === "status_change" &&
      event.status === "down"
    ) {
      current.incidents += 1;
    }
    if (event.ping !== null) {
      current.pings.push(event.ping);
    }
    byMonitor.set(event.monitorName, current);
  }

  const summary = XLSX.utils.aoa_to_sheet([
    [],
    [],
    [],
    [c.server, input.serverName],
    [c.generated, new Date().toLocaleString(locale)],
    [
      locale === "es" ? "Eventos exportados" : "Exported events",
      events.length,
    ],
    [
      locale === "es" ? "Cambios de estado" : "Status changes",
      statusChanges,
    ],
    [
      locale === "es" ? "Eventos importantes" : "Important events",
      important,
    ],
    [
      locale === "es" ? "Ping medio (ms)" : "Average ping (ms)",
      averagePing,
    ],
    [],
    [],
    [
      locale === "es" ? "Monitor" : "Monitor",
      locale === "es" ? "Eventos" : "Events",
      locale === "es" ? "Incidencias" : "Incidents",
      locale === "es" ? "Ping medio (ms)" : "Average ping (ms)",
      locale === "es" ? "Actividad" : "Activity",
    ],
    ...[...byMonitor.entries()]
      .sort((a, b) => b[1].incidents - a[1].incidents)
      .map(([name, data]) => [
        name,
        data.events,
        data.incidents,
        data.pings.length > 0
          ? data.pings.reduce(
              (total, ping) => total + ping,
              0,
            ) / data.pings.length
          : null,
        uptimeBar(
          events.length > 0
            ? data.events / events.length
            : null,
        ),
      ]),
  ]);
  setTitle(
    summary,
    `${c.reportTitle} · Timeline`,
    4,
  );
  addSection(
    summary,
    11,
    locale === "es"
      ? "Actividad por monitor"
      : "Activity by monitor",
    0,
    4,
  );
  styleHeaderRow(summary, 12, 4);
  summary["!cols"] = [
    { wch: 34 },
    { wch: 15 },
    { wch: 15 },
    { wch: 19 },
    { wch: 24 },
  ];

  const eventHeaders =
    locale === "es"
      ? [
          "Fecha local",
          "Fecha ISO",
          "Monitor",
          "Tipo",
          "Estado",
          "Estado anterior",
          "Ping (ms)",
          "Importante",
          "Mensaje",
        ]
      : [
          "Local date",
          "ISO date",
          "Monitor",
          "Type",
          "Status",
          "Previous status",
          "Ping (ms)",
          "Important",
          "Message",
        ];
  const eventRows = [...events]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((event) => [
      new Date(event.createdAt).toLocaleString(locale),
      new Date(event.createdAt).toISOString(),
      event.monitorName,
      event.type,
      event.status,
      event.previousStatus ?? "",
      event.ping,
      event.important ? c.yes : c.no,
      event.message ?? "",
    ]);
  const eventSheet = XLSX.utils.aoa_to_sheet([
    [],
    [],
    [],
    eventHeaders,
    ...eventRows,
  ]);
  setTitle(
    eventSheet,
    locale === "es"
      ? "Detalle de eventos"
      : "Event detail",
    eventHeaders.length - 1,
  );
  styleDataSheet(
    eventSheet,
    4,
    eventHeaders.length - 1,
    eventRows.length + 4,
  );
  for (
    let row = 5;
    row <= eventRows.length + 4;
    row += 1
  ) {
    getCell(eventSheet, `E${row}`).s = statusFill(
      String(getCell(eventSheet, `E${row}`).v),
    );
  }
  eventSheet["!cols"] = [
    { wch: 22 },
    { wch: 26 },
    { wch: 32 },
    { wch: 16 },
    { wch: 13 },
    { wch: 17 },
    { wch: 13 },
    { wch: 12 },
    { wch: 65 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    summary,
    c.sheets.summary,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    eventSheet,
    c.sheets.events,
  );

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
    compression: true,
  }) as string;
}

export function buildTimelineExcelFilename(input: {
  serverName: string;
  monitorName?: string | null;
  now?: number;
}): string {
  const stamp = buildExportTimestamp(input.now);
  const server = slugifyFilenamePart(input.serverName);
  const monitor = input.monitorName
    ? `-${slugifyFilenamePart(input.monitorName)}`
    : "";
  return `kumapulse-timeline-${server}${monitor}-${stamp}.xlsx`;
}
