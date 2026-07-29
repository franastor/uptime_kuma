import type {
  AnalyticsInsight,
  AnalyticsWindow,
  HeatmapCell,
  IncidentInterval,
  LatencyStats,
  MonitorAnalytics,
  PeriodComparative,
  SslCertificateItem,
  StatusDistribution,
  TrendSignal,
} from "@/src/modules/analytics/types/analytics";
import { clipIntervalMs } from "@/src/modules/analytics/utils/clipInterval";
import {
  formatDurationMs,
  getPreviousPeriodLabel,
} from "@/src/modules/analytics/utils/formatAnalytics";

const WEEKDAY_FULL = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

/**
 * Health Score 0–100 a partir de uptime, latencia,
 * incidencias y estabilidad (monitores caídos ahora).
 */
export function computeHealthScore(input: {
  averageUptime: number | null;
  averagePingMs: number | null;
  totalIncidents: number;
  monitorCount: number;
  downCount: number;
}): number | null {
  const {
    averageUptime,
    averagePingMs,
    totalIncidents,
    monitorCount,
    downCount,
  } = input;

  if (monitorCount === 0) {
    return null;
  }

  const uptimeScore =
    averageUptime === null
      ? 70
      : Math.max(0, Math.min(100, averageUptime * 100));

  let latencyScore = 85;

  if (averagePingMs !== null) {
    if (averagePingMs <= 100) {
      latencyScore = 100;
    } else if (averagePingMs <= 250) {
      latencyScore = 90;
    } else if (averagePingMs <= 500) {
      latencyScore = 75;
    } else if (averagePingMs <= 1000) {
      latencyScore = 55;
    } else {
      latencyScore = 35;
    }
  }

  const incidentRate =
    totalIncidents / Math.max(monitorCount, 1);
  const incidentScore = Math.max(
    0,
    100 - incidentRate * 25,
  );

  const downRatio = downCount / monitorCount;
  const stabilityScore = Math.max(
    0,
    100 - downRatio * 100,
  );

  return Math.round(
    uptimeScore * 0.4 +
      latencyScore * 0.2 +
      incidentScore * 0.2 +
      stabilityScore * 0.2,
  );
}

export function buildStatusDistribution(
  monitors: MonitorAnalytics[],
): StatusDistribution {
  const distribution: StatusDistribution = {
    up: 0,
    down: 0,
    pending: 0,
    paused: 0,
    unknown: 0,
    total: monitors.length,
  };

  for (const monitor of monitors) {
    switch (monitor.status) {
      case "up":
        distribution.up += 1;
        break;
      case "down":
        distribution.down += 1;
        break;
      case "pending":
      case "maintenance":
        distribution.pending += 1;
        break;
      case "paused":
        distribution.paused += 1;
        break;
      default:
        distribution.unknown += 1;
        break;
    }
  }

  return distribution;
}

export function findHeatmapHotspot(
  cells: HeatmapCell[],
): HeatmapCell | null {
  let best: HeatmapCell | null = null;

  for (const cell of cells) {
    if (cell.incidents === 0 && cell.downtimeMs === 0) {
      continue;
    }

    if (
      !best ||
      cell.incidents > best.incidents ||
      (cell.incidents === best.incidents &&
        cell.downtimeMs > best.downtimeMs)
    ) {
      best = cell;
    }
  }

  if (!best) {
    return null;
  }

  const totalIncidents = cells.reduce(
    (sum, cell) => sum + cell.incidents,
    0,
  );

  if (
    best.incidents < 2 &&
    best.downtimeMs < 15 * 60 * 1_000
  ) {
    return null;
  }

  if (
    totalIncidents >= 4 &&
    best.incidents / totalIncidents < 0.25
  ) {
    return null;
  }

  return best;
}

function findFlappingMonitors(
  monitors: MonitorAnalytics[],
  windowMs: number,
): MonitorAnalytics[] {
  const minIncidents =
    windowMs <= 24 * 60 * 60 * 1_000 ? 3 : 4;

  return monitors
    .filter((monitor) => {
      if (monitor.incidents < minIncidents) {
        return false;
      }

      const avgDuration =
        monitor.downtimeMs / monitor.incidents;

      return avgDuration <= 20 * 60 * 1_000;
    })
    .sort((a, b) => b.incidents - a.incidents);
}

function findLongOpenIncident(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
  windowMs: number,
): IncidentInterval | null {
  const threshold = Math.min(
    windowMs * 0.25,
    6 * 60 * 60 * 1_000,
  );
  let longest: IncidentInterval | null = null;
  let longestMs = 0;

  for (const interval of intervals) {
    if (interval.end !== null) {
      continue;
    }

    const duration = clipIntervalMs(
      interval.start,
      windowEnd,
      windowStart,
      windowEnd,
    );

    if (duration > longestMs) {
      longest = interval;
      longestMs = duration;
    }
  }

  if (!longest || longestMs < threshold) {
    return null;
  }

  return longest;
}

function findDowntimeConcentration(
  monitors: MonitorAnalytics[],
  totalDowntimeMs: number,
): MonitorAnalytics | null {
  if (totalDowntimeMs <= 0 || monitors.length < 2) {
    return null;
  }

  const top = [...monitors].sort(
    (a, b) => b.downtimeMs - a.downtimeMs,
  )[0];

  if (!top || top.downtimeMs <= 0) {
    return null;
  }

  const share = top.downtimeMs / totalDowntimeMs;

  if (share < 0.5) {
    return null;
  }

  return top;
}

function formatHourRange(hour: number): string {
  const next = (hour + 1) % 24;
  return `${String(hour).padStart(2, "0")}:00–${String(
    next,
  ).padStart(2, "0")}:00`;
}

export function buildTrendSignals(input: {
  window: AnalyticsWindow;
  comparative: PeriodComparative;
  latency: LatencyStats;
  availabilityTrend: {
    window: string;
    label: string;
    uptime: number | null;
  }[];
  heatmap: HeatmapCell[];
  ranking: MonitorAnalytics[];
}): TrendSignal[] {
  const signals: TrendSignal[] = [];
  const {
    window,
    comparative,
    latency,
    availabilityTrend,
    heatmap,
    ranking,
  } = input;
  const previous = getPreviousPeriodLabel(window);

  if (comparative.uptimeDelta !== null) {
    const improving = comparative.uptimeDelta > 0.001;
    const worsening = comparative.uptimeDelta < -0.001;

    signals.push({
      id: "trend-uptime",
      metric: "Uptime",
      direction: improving
        ? "improving"
        : worsening
          ? "worsening"
          : "stable",
      label: improving
        ? "Disponibilidad al alza"
        : worsening
          ? "Disponibilidad a la baja"
          : "Disponibilidad estable",
      detail: improving
        ? `Mejor uptime medio que en ${previous}.`
        : worsening
          ? `El uptime medio empeora frente a ${previous}.`
          : `Sin cambio relevante respecto a ${previous}.`,
      deltaLabel: `${comparative.uptimeDelta >= 0 ? "+" : ""}${(
        comparative.uptimeDelta * 100
      ).toFixed(2)} pp`,
    });
  } else {
    signals.push({
      id: "trend-uptime",
      metric: "Uptime",
      direction: "unknown",
      label: "Uptime sin comparativa",
      detail: `Aún no hay suficiente histórico de ${previous}.`,
      deltaLabel: null,
    });
  }

  if (comparative.incidentsDelta !== null) {
    const improving = comparative.incidentsDelta < 0;
    const worsening = comparative.incidentsDelta > 0;

    signals.push({
      id: "trend-incidents",
      metric: "Incidencias",
      direction: improving
        ? "improving"
        : worsening
          ? "worsening"
          : "stable",
      label: improving
        ? "Menos caídas"
        : worsening
          ? "Más caídas"
          : "Incidencias estables",
      detail: improving
        ? `El volumen de incidencias baja frente a ${previous}.`
        : worsening
          ? `Hay más incidencias que en ${previous}.`
          : `El ritmo de incidencias se mantiene parecido a ${previous}.`,
      deltaLabel: `${
        comparative.incidentsDelta >= 0 ? "+" : ""
      }${comparative.incidentsDelta}`,
    });
  }

  if (latency.deltaMs !== null) {
    const improving = latency.deltaMs < -20;
    const worsening = latency.deltaMs > 20;

    signals.push({
      id: "trend-latency",
      metric: "Latencia",
      direction: improving
        ? "improving"
        : worsening
          ? "worsening"
          : "stable",
      label: improving
        ? "Latencia mejorando"
        : worsening
          ? "Latencia degradándose"
          : "Latencia estable",
      detail: improving
        ? `El ping medio baja respecto a ${previous}.`
        : worsening
          ? `El ping medio sube frente a ${previous}.`
          : `Variación de latencia dentro de un rango normal frente a ${previous}.`,
      deltaLabel: `${latency.deltaMs >= 0 ? "+" : ""}${Math.round(
        latency.deltaMs,
      )} ms`,
    });
  }

  const shortPoint = availabilityTrend.find(
    (point) => point.window === "24h",
  );
  const midPoint = availabilityTrend.find(
    (point) => point.window === "7d",
  );

  if (
    shortPoint?.uptime != null &&
    midPoint?.uptime != null
  ) {
    const delta = shortPoint.uptime - midPoint.uptime;

    if (Math.abs(delta) >= 0.005) {
      signals.push({
        id: "trend-horizon",
        metric: "Horizonte",
        direction: delta > 0 ? "improving" : "worsening",
        label:
          delta > 0
            ? "24 h mejor que 7 d"
            : "24 h peor que 7 d",
        detail:
          delta > 0
            ? "La ventana reciente supera la media semanal."
            : "La ventana reciente está por debajo de la media semanal.",
        deltaLabel: `${delta >= 0 ? "+" : ""}${(
          delta * 100
        ).toFixed(2)} pp`,
      });
    }
  }

  const hotspot = findHeatmapHotspot(heatmap);

  if (hotspot) {
    signals.push({
      id: "trend-hotspot",
      metric: "Patrón",
      direction: "worsening",
      label: `Pico ${WEEKDAY_FULL[hotspot.dayOfWeek]} ${formatHourRange(
        hotspot.hour,
      )}`,
      detail:
        hotspot.incidents > 0
          ? `${hotspot.incidents} incidencia${
              hotspot.incidents === 1 ? "" : "s"
            } concentradas en esa franja.`
          : `Downtime concentrado: ${formatDurationMs(
              hotspot.downtimeMs,
            )}.`,
      deltaLabel: null,
    });
  }

  const worst = ranking[0];

  if (worst && worst.incidents >= 2) {
    signals.push({
      id: "trend-worst-monitor",
      metric: "Monitor",
      direction: "worsening",
      label: worst.monitorName,
      detail: `${worst.incidents} incidencias · downtime ${formatDurationMs(
        worst.downtimeMs,
      )}`,
      deltaLabel: null,
    });
  }

  return signals;
}

function monitorLink(
  monitor:
    | Pick<
        MonitorAnalytics,
        "serverId" | "monitorId" | "monitorName"
      >
    | Pick<
        SslCertificateItem,
        "serverId" | "monitorId" | "monitorName"
      >
    | null
    | undefined,
): Pick<
  AnalyticsInsight,
  "serverId" | "monitorId" | "monitorName"
> {
  if (!monitor) {
    return {};
  }

  return {
    serverId: monitor.serverId,
    monitorId: monitor.monitorId,
    monitorName: monitor.monitorName,
  };
}

export function buildInsights(input: {
  healthScore: number | null;
  averageUptime: number | null;
  slaStatus: string;
  latency: LatencyStats;
  comparative: PeriodComparative;
  distribution: StatusDistribution;
  sslCertificates: SslCertificateItem[];
  monitorsBelowSla: MonitorAnalytics[];
  monitors: MonitorAnalytics[];
  heatmap: HeatmapCell[];
  intervals: IncidentInterval[];
  totalDowntimeMs: number;
  windowStart: number;
  windowEnd: number;
  windowMs: number;
  window: AnalyticsWindow;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const {
    monitors,
    heatmap,
    intervals,
    totalDowntimeMs,
    windowStart,
    windowEnd,
    windowMs,
    sslCertificates,
    monitorsBelowSla,
    window,
  } = input;
  const previous = getPreviousPeriodLabel(window);

  const worstByDowntime = [...monitors].sort(
    (a, b) => b.downtimeMs - a.downtimeMs,
  )[0];
  const worstByLatency = [...monitors]
    .filter((monitor) => monitor.averagePing != null)
    .sort(
      (a, b) =>
        (b.averagePing ?? 0) - (a.averagePing ?? 0),
    )[0];
  const worstByIncidents = [...monitors].sort(
    (a, b) => b.incidents - a.incidents,
  )[0];
  const worstBelowSla = monitorsBelowSla[0];

  if (
    input.healthScore !== null &&
    input.healthScore < 70
  ) {
    insights.push({
      id: "health-low",
      category: "health",
      severity: "critical",
      title: "Salud global baja",
      description: worstByDowntime
        ? `El Health Score está en ${input.healthScore}/100. Empieza por «${worstByDowntime.monitorName}».`
        : `El Health Score está en ${input.healthScore}/100. Revisa monitores caídos e inestables.`,
      ...monitorLink(worstByDowntime),
    });
  } else if (
    input.healthScore !== null &&
    input.healthScore < 85
  ) {
    insights.push({
      id: "health-mid",
      category: "health",
      severity: "warning",
      title: "Hay margen de mejora",
      description: worstByDowntime
        ? `Health Score ${input.healthScore}/100. «${worstByDowntime.monitorName}» es el que más resta.`
        : `Health Score ${input.healthScore}/100. La latencia o las incidencias están restando puntos.`,
      ...monitorLink(worstByDowntime),
    });
  }

  if (input.distribution.down > 0) {
    const downMonitors = monitors.filter(
      (monitor) => monitor.status === "down",
    );
    const first = downMonitors[0];

    insights.push({
      id: "active-down",
      category: "incidents",
      severity: "critical",
      title: `${input.distribution.down} monitor${
        input.distribution.down === 1 ? "" : "es"
      } DOWN`,
      description: first
        ? `Incluye «${first.monitorName}». Atiéndelos desde el centro de operaciones.`
        : "Hay monitores que requieren atención inmediata.",
      ...monitorLink(first),
    });
  }

  const openLong = findLongOpenIncident(
    intervals,
    windowStart,
    windowEnd,
    windowMs,
  );

  if (openLong) {
    const duration = clipIntervalMs(
      openLong.start,
      windowEnd,
      windowStart,
      windowEnd,
    );

    insights.push({
      id: "long-open",
      category: "incidents",
      severity: "critical",
      title: "Incidencia abierta prolongada",
      description: `«${openLong.monitorName}» lleva caído ${formatDurationMs(
        duration,
      )} sin recuperarse.`,
      ...monitorLink(openLong),
    });
  }

  if (input.slaStatus === "breached") {
    insights.push({
      id: "sla-breach",
      category: "sla",
      severity: "critical",
      title: "SLA incumplido",
      description: worstBelowSla
        ? `El uptime medio está bajo el objetivo. El peor es «${worstBelowSla.monitorName}».`
        : "El uptime medio de la ventana está por debajo del objetivo configurado.",
      ...monitorLink(worstBelowSla ?? worstByDowntime),
    });
  } else if (monitorsBelowSla.length > 0) {
    insights.push({
      id: "sla-monitors",
      category: "sla",
      severity: "warning",
      title: `${monitorsBelowSla.length} monitor${
        monitorsBelowSla.length === 1 ? "" : "es"
      } bajo el SLA`,
      description: worstBelowSla
        ? `«${worstBelowSla.monitorName}» no alcanza el umbral${
            monitorsBelowSla.length > 1
              ? ` (+${monitorsBelowSla.length - 1} más)`
              : ""
          }.`
        : "Algunos monitores no alcanzan el umbral aunque el promedio global sí.",
      ...monitorLink(worstBelowSla),
    });
  } else if (input.slaStatus === "at_risk") {
    insights.push({
      id: "sla-risk",
      category: "sla",
      severity: "warning",
      title: "SLA en riesgo",
      description: worstByDowntime
        ? `El presupuesto de error se consume. Vigila «${worstByDowntime.monitorName}».`
        : "El presupuesto de error se está consumiendo: un par de caídas más pueden romper el objetivo.",
      ...monitorLink(worstByDowntime),
    });
  }

  const hotspot = findHeatmapHotspot(heatmap);

  if (hotspot) {
    insights.push({
      id: "pattern-hotspot",
      category: "pattern",
      severity: "warning",
      title: "Patrón recurrente de caídas",
      description: `Las incidencias se concentran el ${
        WEEKDAY_FULL[hotspot.dayOfWeek]
      } entre ${formatHourRange(
        hotspot.hour,
      )}${
        worstByIncidents
          ? `. Revisa sobre todo «${worstByIncidents.monitorName}».`
          : ". Revisa despliegues o cargas en esa franja."
      }`,
      ...monitorLink(worstByIncidents),
    });
  }

  const flappers = findFlappingMonitors(
    monitors,
    windowMs,
  );

  if (flappers.length > 0) {
    const top = flappers[0];
    insights.push({
      id: "flapping",
      category: "incidents",
      severity: "warning",
      title: "Monitor inestable (flapping)",
      description: `«${top.monitorName}» ha tenido ${top.incidents} caídas cortas. Suele indicar red inestable o umbral demasiado agresivo.`,
      ...monitorLink(top),
    });
  }

  const concentration = findDowntimeConcentration(
    monitors,
    totalDowntimeMs,
  );

  if (concentration) {
    const share = Math.round(
      (concentration.downtimeMs / totalDowntimeMs) *
        100,
    );

    insights.push({
      id: "downtime-concentration",
      category: "pattern",
      severity: "warning",
      title: "Downtime muy concentrado",
      description: `«${concentration.monitorName}» acumula el ${share} % del downtime de la ventana.`,
      ...monitorLink(concentration),
    });
  }

  const slowMonitor = [...monitors]
    .filter(
      (monitor) =>
        monitor.p95Ping != null &&
        monitor.p95Ping >= 800,
    )
    .sort(
      (a, b) => (b.p95Ping ?? 0) - (a.p95Ping ?? 0),
    )[0];

  if (slowMonitor?.p95Ping != null) {
    insights.push({
      id: "latency-p95",
      category: "latency",
      severity: "warning",
      title: "Latencia P95 elevada",
      description: `«${slowMonitor.monitorName}» tiene P95 de ${Math.round(
        slowMonitor.p95Ping,
      )} ms. Puede degradarse antes de caer.`,
      ...monitorLink(slowMonitor),
    });
  }

  if (
    input.latency.deltaMs !== null &&
    input.latency.deltaMs > 50
  ) {
    insights.push({
      id: "latency-up",
      category: "latency",
      severity: "warning",
      title: "Latencia al alza",
      description: worstByLatency
        ? `El ping medio ha subido ${Math.round(
            input.latency.deltaMs,
          )} ms. El más lento ahora es «${worstByLatency.monitorName}».`
        : `El ping medio ha subido ${Math.round(
            input.latency.deltaMs,
          )} ms respecto a ${previous}.`,
      ...monitorLink(worstByLatency),
    });
  } else if (
    input.latency.deltaMs !== null &&
    input.latency.deltaMs < -50
  ) {
    insights.push({
      id: "latency-down",
      category: "improvement",
      severity: "info",
      title: "Latencia mejorando",
      description: `El ping medio ha bajado ${Math.round(
        Math.abs(input.latency.deltaMs),
      )} ms frente a ${previous}.`,
    });
  }

  if (
    input.comparative.incidentsDelta !== null &&
    input.comparative.incidentsDelta > 0
  ) {
    insights.push({
      id: "incidents-up",
      category: "incidents",
      severity: "warning",
      title: "Más incidencias que antes",
      description: worstByIncidents
        ? `Hay ${input.comparative.incidentsDelta} incidencia${
            input.comparative.incidentsDelta === 1
              ? ""
              : "s"
          } más. «${worstByIncidents.monitorName}» lidera las caídas.`
        : `Hay ${input.comparative.incidentsDelta} incidencia${
            input.comparative.incidentsDelta === 1
              ? ""
              : "s"
          } más que en ${previous}.`,
      ...monitorLink(worstByIncidents),
    });
  } else if (
    input.comparative.incidentsDelta !== null &&
    input.comparative.incidentsDelta < 0
  ) {
    insights.push({
      id: "incidents-down",
      category: "improvement",
      severity: "info",
      title: "Menos incidencias",
      description: `Hay ${Math.abs(
        input.comparative.incidentsDelta,
      )} incidencia${
        Math.abs(input.comparative.incidentsDelta) ===
        1
          ? ""
          : "s"
      } menos que en ${previous}.`,
    });
  }

  if (
    input.comparative.uptimeDelta !== null &&
    input.comparative.uptimeDelta >= 0.005
  ) {
    insights.push({
      id: "uptime-up",
      category: "improvement",
      severity: "info",
      title: "Disponibilidad mejorando",
      description: `El uptime medio sube ${(
        input.comparative.uptimeDelta * 100
      ).toFixed(2)} puntos porcentuales frente a ${previous}.`,
    });
  }

  const expiringSoon = sslCertificates.filter(
    (item) =>
      item.daysRemaining != null &&
      item.daysRemaining <= 30,
  );
  const soonestCert = expiringSoon[0];

  if (expiringSoon.length > 0 && soonestCert) {
    const days = soonestCert.daysRemaining;
    insights.push({
      id: "ssl-soon",
      category: "ssl",
      severity: "warning",
      title: "Certificados próximos a caducar",
      description:
        days == null
          ? `«${soonestCert.monitorName}» tiene un certificado próximo a caducar${
              expiringSoon.length > 1
                ? ` (+${expiringSoon.length - 1} más)`
                : ""
            }.`
          : `«${soonestCert.monitorName}» caduca en ${days} día${
              days === 1 ? "" : "s"
            }${
              expiringSoon.length > 1
                ? ` (+${expiringSoon.length - 1} más)`
                : ""
            }.`,
      ...monitorLink(soonestCert),
    });
  }

  const severityRank = {
    critical: 0,
    warning: 1,
    info: 2,
  } as const;

  insights.sort(
    (a, b) =>
      severityRank[a.severity] -
      severityRank[b.severity],
  );

  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      category: "improvement",
      severity: "info",
      title: "Todo bajo control",
      description:
        "No hay señales claras de degradación en esta ventana.",
    });
  }

  return insights.slice(0, 8);
}
