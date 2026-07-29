import type {
  InsightSeverity,
  SlaStatus,
} from "@/src/modules/analytics/types/analytics";
import { colors } from "@/src/shared/theme";

export function formatUptimePercent(
  ratio: number | null,
): string {
  if (ratio === null || !Number.isFinite(ratio)) {
    return "—";
  }

  const percent = ratio * 100;

  if (percent >= 99.995) {
    return "100 %";
  }

  if (percent >= 99) {
    return `${percent.toFixed(2)} %`;
  }

  return `${percent.toFixed(1)} %`;
}

export function formatDurationMs(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const totalSeconds = Math.round(value / 1_000);

  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const totalMinutes = Math.round(
    totalSeconds / 60,
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 48) {
    return minutes === 0
      ? `${hours} h`
      : `${hours} h ${minutes} min`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return remHours === 0
    ? `${days} d`
    : `${days} d ${remHours} h`;
}

export function formatPingMs(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${Math.round(value)} ms`;
}

export function formatSignedDelta(
  value: number | null,
  options?: {
    suffix?: string;
    asPercent?: boolean;
    digits?: number;
  },
): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const digits = options?.digits ?? 0;
  const display = options?.asPercent
    ? value * 100
    : value;
  const absolute = Math.abs(display).toFixed(
    digits,
  );
  const sign =
    display > 0 ? "+" : display < 0 ? "−" : "";
  const suffix = options?.suffix ?? "";

  return `${sign}${absolute}${suffix}`;
}

export function getDeltaColor(
  value: number | null,
  invert = false,
): string {
  if (value === null || value === 0) {
    return colors.textMuted;
  }

  const improved = invert ? value > 0 : value < 0;

  return improved ? colors.success : colors.danger;
}

export function getSlaLabel(
  status: SlaStatus,
): string {
  switch (status) {
    case "met":
      return "Cumplido";
    case "at_risk":
      return "En riesgo";
    case "breached":
      return "Incumplido";
    default:
      return "Sin datos";
  }
}

export function getSlaColor(
  status: SlaStatus,
): string {
  switch (status) {
    case "met":
      return colors.success;
    case "at_risk":
      return colors.warning;
    case "breached":
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

export function getHealthColor(
  score: number | null,
): string {
  if (score === null) {
    return colors.textMuted;
  }

  if (score >= 90) {
    return colors.success;
  }

  if (score >= 75) {
    return colors.primary;
  }

  if (score >= 60) {
    return colors.warning;
  }

  return colors.danger;
}

export function getInsightColor(
  severity: InsightSeverity,
): string {
  switch (severity) {
    case "critical":
      return colors.danger;
    case "warning":
      return colors.warning;
    default:
      return colors.info;
  }
}

export const WEEKDAY_LABELS = [
  "D",
  "L",
  "M",
  "X",
  "J",
  "V",
  "S",
] as const;
