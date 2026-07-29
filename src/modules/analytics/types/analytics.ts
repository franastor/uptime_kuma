export type AnalyticsWindow =
  | "24h"
  | "7d"
  | "30d"
  | "90d";

export type SlaStatus =
  | "met"
  | "at_risk"
  | "breached"
  | "unknown";

export type InsightSeverity =
  | "info"
  | "warning"
  | "critical";

export type IncidentInterval = {
  serverId: string;
  monitorId: number;
  monitorName: string;
  serverName: string;
  start: number;
  end: number | null;
};

export type HeatmapCell = {
  dayOfWeek: number;
  hour: number;
  downtimeMs: number;
  incidents: number;
};

export type MonitorAnalytics = {
  serverId: string;
  monitorId: number;
  monitorName: string;
  serverName: string;
  uptime: number | null;
  uptimeSource: "kuma" | "estimated" | null;
  downtimeMs: number;
  incidents: number;
  mttrMs: number | null;
  mtbfMs: number | null;
  averagePing: number | null;
  peakPing: number | null;
  p95Ping: number | null;
  slaStatus: SlaStatus;
  slaUptime: number | null;
  slaTarget: number;
  status:
    | "up"
    | "down"
    | "pending"
    | "maintenance"
    | "paused"
    | "unknown";
  certificateDaysRemaining: number | null;
  certificateValid: boolean | null;
};

export type StatusDistribution = {
  up: number;
  down: number;
  pending: number;
  paused: number;
  unknown: number;
  total: number;
};

export type LatencyStats = {
  averageMs: number | null;
  peakMs: number | null;
  p95Ms: number | null;
  previousAverageMs: number | null;
  deltaMs: number | null;
};

export type PeriodComparative = {
  uptimeDelta: number | null;
  incidentsDelta: number | null;
  pingDeltaMs: number | null;
  previousUptime: number | null;
  previousIncidents: number;
  previousPingMs: number | null;
};

export type SslCertificateItem = {
  serverId: string;
  monitorId: number;
  monitorName: string;
  daysRemaining: number | null;
  valid: boolean | null;
};

export type AnalyticsInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
};

export type AvailabilityPoint = {
  window: AnalyticsWindow;
  label: string;
  uptime: number | null;
};

export type AnalyticsSummary = {
  window: AnalyticsWindow;
  windowStart: number;
  windowEnd: number;
  windowMs: number;
  monitorCount: number;
  averageUptime: number | null;
  totalDowntimeMs: number;
  totalIncidents: number;
  averagePing: number | null;
  mttrMs: number | null;
  mtbfMs: number | null;
  /** Objetivo único si todos los servidores coinciden; null si hay varios. */
  slaTarget: number | null;
  slaStatus: SlaStatus;
  monitorsBelowSla: MonitorAnalytics[];
  ranking: MonitorAnalytics[];
  latencyRanking: MonitorAnalytics[];
  priorityMonitors: MonitorAnalytics[];
  heatmap: HeatmapCell[];
  healthScore: number | null;
  statusDistribution: StatusDistribution;
  latency: LatencyStats;
  comparative: PeriodComparative;
  sslCertificates: SslCertificateItem[];
  availabilityTrend: AvailabilityPoint[];
  insights: AnalyticsInsight[];
  hasLimitedHistory: boolean;
};

export const DEFAULT_SLA_TARGET = 0.999;
/** @deprecated Prefer DEFAULT_SLA_TARGET; se mantiene por compatibilidad. */
export const SLA_TARGET = DEFAULT_SLA_TARGET;

export const ANALYTICS_WINDOWS: {
  id: AnalyticsWindow;
  label: string;
  ms: number;
}[] = [
  {
    id: "24h",
    label: "24 h",
    ms: 24 * 60 * 60 * 1_000,
  },
  {
    id: "7d",
    label: "7 días",
    ms: 7 * 24 * 60 * 60 * 1_000,
  },
  {
    id: "30d",
    label: "30 días",
    ms: 30 * 24 * 60 * 60 * 1_000,
  },
  {
    id: "90d",
    label: "90 días",
    ms: 90 * 24 * 60 * 60 * 1_000,
  },
];

export function getAnalyticsWindowMs(
  window: AnalyticsWindow,
): number {
  return (
    ANALYTICS_WINDOWS.find(
      (item) => item.id === window,
    )?.ms ?? ANALYTICS_WINDOWS[0].ms
  );
}
