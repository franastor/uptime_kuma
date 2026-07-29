import type { AnalyticsSummary } from "@/src/modules/analytics/types/analytics";
import {
  buildExportTimestamp,
  escapeCsvValue,
  rowsToCsv,
  slugifyFilenamePart,
  CSV_SEPARATOR,
} from "@/src/modules/export/utils/csv";

const MONITOR_HEADERS = [
  "serverId",
  "monitorId",
  "monitorName",
  "status",
  "uptime",
  "uptimeSource",
  "downtimeMs",
  "incidents",
  "mttrMs",
  "mtbfMs",
  "averagePingMs",
  "peakPingMs",
  "p95PingMs",
  "slaStatus",
  "slaUptime",
  "slaTarget",
  "certificateDaysRemaining",
  "certificateValid",
] as const;

export function buildAnalyticsCsv(
  summary: AnalyticsSummary,
): string {
  const summaryLines = [
    ["section", "field", "value"],
    ["summary", "window", summary.window],
    [
      "summary",
      "windowStartIso",
      new Date(summary.windowStart).toISOString(),
    ],
    [
      "summary",
      "windowEndIso",
      new Date(summary.windowEnd).toISOString(),
    ],
    ["summary", "monitorCount", summary.monitorCount],
    ["summary", "averageUptime", summary.averageUptime],
    [
      "summary",
      "totalDowntimeMs",
      summary.totalDowntimeMs,
    ],
    [
      "summary",
      "totalIncidents",
      summary.totalIncidents,
    ],
    ["summary", "averagePingMs", summary.averagePing],
    ["summary", "mttrMs", summary.mttrMs],
    ["summary", "mtbfMs", summary.mtbfMs],
    ["summary", "slaTarget", summary.slaTarget],
    ["summary", "slaStatus", summary.slaStatus],
    ["summary", "healthScore", summary.healthScore],
    [
      "summary",
      "latencyAverageMs",
      summary.latency.averageMs,
    ],
    ["summary", "latencyPeakMs", summary.latency.peakMs],
    ["summary", "latencyP95Ms", summary.latency.p95Ms],
    [
      "summary",
      "latencyDeltaMs",
      summary.latency.deltaMs,
    ],
    [
      "summary",
      "uptimeDelta",
      summary.comparative.uptimeDelta,
    ],
    [
      "summary",
      "incidentsDelta",
      summary.comparative.incidentsDelta,
    ],
    [
      "summary",
      "statusUp",
      summary.statusDistribution.up,
    ],
    [
      "summary",
      "statusDown",
      summary.statusDistribution.down,
    ],
    [
      "summary",
      "statusPaused",
      summary.statusDistribution.paused,
    ],
  ]
    .map((row) =>
      row.map(escapeCsvValue).join(CSV_SEPARATOR),
    )
    .join("\n");

  const monitors = [...summary.monitors].sort((a, b) =>
    a.monitorName.localeCompare(b.monitorName, "es"),
  );

  const monitorsCsv = rowsToCsv(
    [...MONITOR_HEADERS],
    monitors.map((monitor) => [
      monitor.serverId,
      monitor.monitorId,
      monitor.monitorName,
      monitor.status,
      monitor.uptime,
      monitor.uptimeSource,
      monitor.downtimeMs,
      monitor.incidents,
      monitor.mttrMs,
      monitor.mtbfMs,
      monitor.averagePing,
      monitor.peakPing,
      monitor.p95Ping,
      monitor.slaStatus,
      monitor.slaUptime,
      monitor.slaTarget,
      monitor.certificateDaysRemaining,
      monitor.certificateValid,
    ]),
  ).replace(/^\uFEFF/, "");

  return `\uFEFF${summaryLines}\n\n${monitorsCsv}`;
}

export function buildAnalyticsExportFilename(input: {
  serverName: string;
  window: string;
  now?: number;
}): string {
  const stamp = buildExportTimestamp(input.now);
  const server = slugifyFilenamePart(input.serverName);

  return `kumapulse-analytics-${server}-${input.window}-${stamp}.csv`;
}
