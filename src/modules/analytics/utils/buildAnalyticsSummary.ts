import {
  ANALYTICS_WINDOWS,
  DEFAULT_SLA_TARGET,
  getAnalyticsWindowMs,
  type AnalyticsSummary,
  type AnalyticsWindow,
  type AvailabilityPoint,
  type MonitorAnalytics,
  type SslCertificateItem,
} from "@/src/modules/analytics/types/analytics";
import {
  buildInsights,
  buildStatusDistribution,
  buildTrendSignals,
  computeHealthScore,
} from "@/src/modules/analytics/utils/buildAdvancedMetrics";
import { buildHeatmap } from "@/src/modules/analytics/utils/buildHeatmap";
import { buildIncidentIntervals } from "@/src/modules/analytics/utils/buildIncidentIntervals";
import {
  computeDowntimeMs,
  countIncidentsInWindow,
  filterIntervalsForMonitor,
} from "@/src/modules/analytics/utils/computeDowntime";
import {
  computeMtbfMs,
  computeMttrMs,
} from "@/src/modules/analytics/utils/computeReliability";
import {
  computeSlaStatus,
  estimateUptimeFromDowntime,
} from "@/src/modules/analytics/utils/computeSla";
import {
  averageNumber,
  maxNumber,
  percentile,
} from "@/src/modules/analytics/utils/statsMath";
import type { MonitorStats } from "@/src/modules/monitor/store/monitorStats.store";
import { buildMonitorStatsKey } from "@/src/modules/monitor/store/monitorStats.store";
import type { MonitorHeartbeatRecord } from "@/src/modules/monitor/types/heartbeatHistory";
import { buildHeartbeatRecordKey } from "@/src/modules/monitor/types/heartbeatHistory";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";

export type AnalyticsMonitorInput = {
  serverId: string;
  serverName: string;
  monitor: Monitor;
};

type BuildAnalyticsSummaryInput = {
  events: TimelineEvent[];
  monitors: AnalyticsMonitorInput[];
  statsByMonitor: Record<string, MonitorStats>;
  heartbeatsByMonitor?: Record<
    string,
    MonitorHeartbeatRecord[]
  >;
  window: AnalyticsWindow;
  serverId?: string | null;
  resolveSlaTarget?: (
    serverId: string,
  ) => number;
  now?: number;
  rankingLimit?: number;
};

function pickUptime(
  stats: MonitorStats | undefined,
  window: AnalyticsWindow,
  estimated: number | null,
): {
  uptime: number | null;
  source: "kuma" | "estimated" | null;
} {
  if (window === "24h" && stats?.uptime24h != null) {
    return {
      uptime: stats.uptime24h,
      source: "kuma",
    };
  }

  if (
    (window === "7d" ||
      window === "30d" ||
      window === "90d") &&
    stats?.uptime30d != null
  ) {
    return {
      uptime: stats.uptime30d,
      source: "kuma",
    };
  }

  if (estimated !== null) {
    return {
      uptime: estimated,
      source: "estimated",
    };
  }

  return { uptime: null, source: null };
}

function pingsInWindow(
  records: MonitorHeartbeatRecord[],
  windowStart: number,
  windowEnd: number,
): number[] {
  return records
    .filter(
      (record) =>
        record.createdAt >= windowStart &&
        record.createdAt <= windowEnd &&
        record.ping !== null &&
        Number.isFinite(record.ping),
    )
    .map((record) => record.ping as number);
}

function resolveMonitorStatus(
  monitor: Monitor,
): MonitorAnalytics["status"] {
  if (!monitor.active) {
    return "paused";
  }

  return monitor.status;
}

export function buildAnalyticsSummary({
  events,
  monitors,
  statsByMonitor,
  heartbeatsByMonitor = {},
  window,
  serverId = null,
  resolveSlaTarget = () => DEFAULT_SLA_TARGET,
  now = Date.now(),
  rankingLimit = 10,
}: BuildAnalyticsSummaryInput): AnalyticsSummary {
  const windowMs = getAnalyticsWindowMs(window);
  const windowEnd = now;
  const windowStart = now - windowMs;
  const previousStart = windowStart - windowMs;
  const previousEnd = windowStart;

  const scopedMonitors = serverId
    ? monitors.filter(
        (item) => item.serverId === serverId,
      )
    : monitors;

  const scopedEvents = serverId
    ? events.filter(
        (event) => event.serverId === serverId,
      )
    : events;

  const intervals = buildIncidentIntervals(
    scopedEvents,
    now,
  );

  const allPings: number[] = [];
  const previousPings: number[] = [];
  const perMonitor: MonitorAnalytics[] = [];

  for (const item of scopedMonitors) {
    const key = buildMonitorStatsKey(
      item.serverId,
      item.monitor.id,
    );
    const heartbeatKey = buildHeartbeatRecordKey(
      item.serverId,
      item.monitor.id,
    );
    const stats = statsByMonitor[key];
    const heartbeats =
      heartbeatsByMonitor[heartbeatKey] ?? [];
    const monitorIntervals =
      filterIntervalsForMonitor(
        intervals,
        item.serverId,
        item.monitor.id,
      );
    const downtimeMs = computeDowntimeMs(
      monitorIntervals,
      windowStart,
      windowEnd,
    );
    const incidents = countIncidentsInWindow(
      monitorIntervals,
      windowStart,
      windowEnd,
    );
    const estimated = estimateUptimeFromDowntime(
      downtimeMs,
      windowMs,
    );
    const { uptime, source } = pickUptime(
      stats,
      window,
      estimated,
    );
    const slaUptime = uptime ?? estimated;
    const monitorSlaTarget = resolveSlaTarget(
      item.serverId,
    );
    const windowPings = pingsInWindow(
      heartbeats,
      windowStart,
      windowEnd,
    );
    const priorPings = pingsInWindow(
      heartbeats,
      previousStart,
      previousEnd,
    );

    allPings.push(...windowPings);
    previousPings.push(...priorPings);

    const averagePing =
      averageNumber(windowPings) ??
      stats?.averagePing24h ??
      item.monitor.ping;

    perMonitor.push({
      serverId: item.serverId,
      monitorId: item.monitor.id,
      monitorName: item.monitor.name,
      serverName: item.serverName,
      uptime,
      uptimeSource: source,
      downtimeMs,
      incidents,
      mttrMs: computeMttrMs(
        monitorIntervals,
        windowStart,
        windowEnd,
      ),
      mtbfMs: computeMtbfMs(
        monitorIntervals,
        windowStart,
        windowEnd,
      ),
      averagePing,
      peakPing: maxNumber(windowPings),
      p95Ping: percentile(windowPings, 95),
      slaStatus: computeSlaStatus(
        slaUptime,
        monitorSlaTarget,
      ),
      slaUptime,
      slaTarget: monitorSlaTarget,
      status: resolveMonitorStatus(item.monitor),
      certificateDaysRemaining:
        stats?.certificateDaysRemaining ?? null,
      certificateValid:
        stats?.certificateValid ?? null,
    });
  }

  const activeMonitors = perMonitor.filter(
    (item) => item.status !== "paused",
  );

  const totalDowntimeMs = computeDowntimeMs(
    intervals,
    windowStart,
    windowEnd,
  );
  const totalIncidents = countIncidentsInWindow(
    intervals,
    windowStart,
    windowEnd,
  );
  const previousIncidents =
    countIncidentsInWindow(
      intervals,
      previousStart,
      previousEnd,
    );

  const previousDowntimeMs = computeDowntimeMs(
    intervals,
    previousStart,
    previousEnd,
  );
  const previousUptime = estimateUptimeFromDowntime(
    previousDowntimeMs,
    windowMs,
  );

  const averageUptime = averageNumber(
    activeMonitors
      .map((item) => item.uptime)
      .filter(
        (value): value is number =>
          value !== null,
      ),
  );
  const averagePing =
    averageNumber(allPings) ??
    averageNumber(
      activeMonitors
        .map((item) => item.averagePing)
        .filter(
          (value): value is number =>
            value !== null,
        ),
    );
  const previousAveragePing =
    averageNumber(previousPings);

  const uniqueTargets = [
    ...new Set(
      activeMonitors.map(
        (item) => item.slaTarget,
      ),
    ),
  ];
  const summarySlaTarget =
    uniqueTargets.length === 1
      ? uniqueTargets[0]
      : serverId
        ? resolveSlaTarget(serverId)
        : null;

  const slaStatus =
    summarySlaTarget === null
      ? "unknown"
      : computeSlaStatus(
          averageUptime,
          summarySlaTarget,
        );

  const monitorsBelowSla = activeMonitors
    .filter(
      (item) =>
        item.slaStatus === "breached" ||
        item.slaStatus === "at_risk",
    )
    .sort(
      (left, right) =>
        (left.slaUptime ?? 1) -
        (right.slaUptime ?? 1),
    );

  const ranking = [...activeMonitors]
    .sort((left, right) => {
      if (right.downtimeMs !== left.downtimeMs) {
        return right.downtimeMs - left.downtimeMs;
      }

      if (right.incidents !== left.incidents) {
        return right.incidents - left.incidents;
      }

      return (
        (left.uptime ?? 1) - (right.uptime ?? 1)
      );
    })
    .slice(0, rankingLimit);

  const latencyRanking = [...activeMonitors]
    .filter((item) => item.averagePing !== null)
    .sort(
      (left, right) =>
        (right.averagePing ?? 0) -
        (left.averagePing ?? 0),
    )
    .slice(0, rankingLimit);

  const priorityMonitors = [...activeMonitors]
    .filter(
      (item) =>
        item.status === "down" ||
        item.status === "pending" ||
        item.status === "maintenance" ||
        item.slaStatus === "breached",
    )
    .sort((left, right) => {
      const rank = (
        status: MonitorAnalytics["status"],
      ): number => {
        if (status === "down") {
          return 0;
        }

        if (
          status === "pending" ||
          status === "maintenance"
        ) {
          return 1;
        }

        return 2;
      };

      return rank(left.status) - rank(right.status);
    })
    .slice(0, rankingLimit);

  const statusDistribution =
    buildStatusDistribution(perMonitor);

  const latency = {
    averageMs: averagePing,
    peakMs: maxNumber(allPings),
    p95Ms: percentile(allPings, 95),
    previousAverageMs: previousAveragePing,
    deltaMs:
      averagePing !== null &&
      previousAveragePing !== null
        ? averagePing - previousAveragePing
        : null,
  };

  const comparative = {
    uptimeDelta:
      averageUptime !== null &&
      previousUptime !== null
        ? averageUptime - previousUptime
        : null,
    incidentsDelta:
      totalIncidents - previousIncidents,
    pingDeltaMs: latency.deltaMs,
    previousUptime,
    previousIncidents,
    previousPingMs: previousAveragePing,
  };

  const sslCertificates: SslCertificateItem[] =
    activeMonitors
      .filter(
        (item) =>
          item.certificateDaysRemaining != null ||
          item.certificateValid != null,
      )
      .map((item) => ({
        serverId: item.serverId,
        monitorId: item.monitorId,
        monitorName: item.monitorName,
        daysRemaining:
          item.certificateDaysRemaining,
        valid: item.certificateValid,
      }))
      .sort((left, right) => {
        const leftDays =
          left.daysRemaining ??
          Number.POSITIVE_INFINITY;
        const rightDays =
          right.daysRemaining ??
          Number.POSITIVE_INFINITY;

        return leftDays - rightDays;
      });

  const availabilityTrend: AvailabilityPoint[] =
    ANALYTICS_WINDOWS.map((item) => {
      const pointMs = item.ms;
      const pointStart = now - pointMs;
      const downtime = computeDowntimeMs(
        intervals,
        pointStart,
        now,
      );
      const estimated = estimateUptimeFromDowntime(
        downtime,
        pointMs,
      );

      if (item.id === "24h") {
        const kumaValues = activeMonitors
          .map((monitor) => {
            const key = buildMonitorStatsKey(
              monitor.serverId,
              monitor.monitorId,
            );
            return statsByMonitor[key]?.uptime24h;
          })
          .filter(
            (value): value is number =>
              typeof value === "number",
          );

        return {
          window: item.id,
          label: item.label,
          uptime:
            averageNumber(kumaValues) ?? estimated,
        };
      }

      if (
        item.id === "30d" ||
        item.id === "7d" ||
        item.id === "90d"
      ) {
        const kumaValues = activeMonitors
          .map((monitor) => {
            const key = buildMonitorStatsKey(
              monitor.serverId,
              monitor.monitorId,
            );
            return statsByMonitor[key]?.uptime30d;
          })
          .filter(
            (value): value is number =>
              typeof value === "number",
          );

        return {
          window: item.id,
          label: item.label,
          uptime:
            item.id === "30d" || item.id === "90d"
              ? (averageNumber(kumaValues) ??
                estimated)
              : estimated,
        };
      }

      return {
        window: item.id,
        label: item.label,
        uptime: estimated,
      };
    });

  const healthScore = computeHealthScore({
    averageUptime,
    averagePingMs: averagePing,
    totalIncidents,
    monitorCount: activeMonitors.length,
    downCount: statusDistribution.down,
  });

  const heatmap = buildHeatmap(
    intervals,
    windowStart,
    windowEnd,
  );

  const trends = buildTrendSignals({
    window,
    comparative,
    latency,
    availabilityTrend,
    heatmap,
    ranking,
  });

  const insights = buildInsights({
    healthScore,
    averageUptime,
    slaStatus,
    latency,
    comparative,
    distribution: statusDistribution,
    sslCertificates,
    monitorsBelowSla,
    monitors: activeMonitors,
    heatmap,
    intervals,
    totalDowntimeMs,
    windowStart,
    windowEnd,
    windowMs,
    window,
  });

  const eventsInWindow = scopedEvents.filter(
    (event) =>
      event.createdAt >= windowStart &&
      event.createdAt <= windowEnd,
  ).length;

  return {
    window,
    windowStart,
    windowEnd,
    windowMs,
    monitorCount: activeMonitors.length,
    averageUptime,
    totalDowntimeMs,
    totalIncidents,
    averagePing,
    mttrMs: computeMttrMs(
      intervals,
      windowStart,
      windowEnd,
    ),
    mtbfMs: computeMtbfMs(
      intervals,
      windowStart,
      windowEnd,
    ),
    slaTarget: summarySlaTarget,
    slaStatus,
    monitorsBelowSla,
    ranking,
    latencyRanking,
    priorityMonitors,
    monitors: activeMonitors,
    heatmap,
    healthScore,
    statusDistribution,
    latency,
    comparative,
    sslCertificates,
    availabilityTrend,
    trends,
    insights,
    hasLimitedHistory:
      eventsInWindow < 3 &&
      totalIncidents === 0 &&
      window !== "24h",
  };
}

export function getAnalyticsWindowLabel(
  window: AnalyticsWindow,
): string {
  return (
    ANALYTICS_WINDOWS.find(
      (item) => item.id === window,
    )?.label ?? window
  );
}
