import type {
  AnalyticsInsight,
  LatencyStats,
  MonitorAnalytics,
  PeriodComparative,
  StatusDistribution,
} from "@/src/modules/analytics/types/analytics";

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

export function buildInsights(input: {
  healthScore: number | null;
  averageUptime: number | null;
  slaStatus: string;
  latency: LatencyStats;
  comparative: PeriodComparative;
  distribution: StatusDistribution;
  sslExpiringSoon: number;
  monitorsBelowSla: number;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (
    input.healthScore !== null &&
    input.healthScore < 70
  ) {
    insights.push({
      id: "health-low",
      severity: "critical",
      title: "Salud global baja",
      description: `El Health Score está en ${input.healthScore}/100. Revisa monitores caídos e inestables.`,
    });
  } else if (
    input.healthScore !== null &&
    input.healthScore < 85
  ) {
    insights.push({
      id: "health-mid",
      severity: "warning",
      title: "Hay margen de mejora",
      description: `Health Score ${input.healthScore}/100. La latencia o las incidencias están restando puntos.`,
    });
  }

  if (input.distribution.down > 0) {
    insights.push({
      id: "active-down",
      severity: "critical",
      title: `${input.distribution.down} monitor${
        input.distribution.down === 1 ? "" : "es"
      } DOWN`,
      description:
        "Hay monitores que requieren atención inmediata en el centro de operaciones.",
    });
  }

  if (input.slaStatus === "breached") {
    insights.push({
      id: "sla-breach",
      severity: "critical",
      title: "SLA incumplido",
      description:
        "El uptime medio de la ventana está por debajo del objetivo configurado.",
    });
  } else if (input.monitorsBelowSla > 0) {
    insights.push({
      id: "sla-monitors",
      severity: "warning",
      title: `${input.monitorsBelowSla} monitor${
        input.monitorsBelowSla === 1 ? "" : "es"
      } bajo el SLA`,
      description:
        "Algunos monitores no alcanzan el umbral aunque el promedio global sí.",
    });
  }

  if (
    input.latency.deltaMs !== null &&
    input.latency.deltaMs > 50
  ) {
    insights.push({
      id: "latency-up",
      severity: "warning",
      title: "Latencia al alza",
      description: `El ping medio ha subido ${Math.round(
        input.latency.deltaMs,
      )} ms respecto al periodo anterior.`,
    });
  }

  if (
    input.comparative.incidentsDelta !== null &&
    input.comparative.incidentsDelta > 0
  ) {
    insights.push({
      id: "incidents-up",
      severity: "warning",
      title: "Más incidencias que antes",
      description: `Hay ${input.comparative.incidentsDelta} incidencia${
        input.comparative.incidentsDelta === 1
          ? ""
          : "s"
      } más que en el periodo previo.`,
    });
  }

  if (input.sslExpiringSoon > 0) {
    insights.push({
      id: "ssl-soon",
      severity: "warning",
      title: "Certificados próximos a caducar",
      description: `${input.sslExpiringSoon} certificado${
        input.sslExpiringSoon === 1 ? "" : "s"
      } caducan en menos de 30 días.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      severity: "info",
      title: "Todo bajo control",
      description:
        "No hay señales claras de degradación en esta ventana.",
    });
  }

  return insights;
}
