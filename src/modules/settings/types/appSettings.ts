import { DEFAULT_SLA_TARGET } from "@/src/modules/analytics/types/analytics";

export type AppSettings = {
  /** Objetivo SLA por servidor (`serverId` → ratio 0–1). */
  slaTargetByServer: Record<string, number>;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  slaTargetByServer: {},
};

/** Clave interna tras migrar el SLA global de v1. */
export const LEGACY_DEFAULT_SLA_KEY =
  "__legacy_default__";

/** Valores habituales de objetivo SLA (ratio 0–1). */
export const SLA_TARGET_PRESETS = [
  0.95, 0.99, 0.995, 0.999, 0.9995, 0.9999, 1,
] as const;

export const MIN_SLA_TARGET = 0.9;
export const MAX_SLA_TARGET = 1;

export function clampSlaTarget(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SLA_TARGET;
  }

  return Math.min(
    MAX_SLA_TARGET,
    Math.max(MIN_SLA_TARGET, value),
  );
}

export function resolveSlaTarget(
  slaTargetByServer: Record<string, number>,
  serverId: string,
): number {
  const stored = slaTargetByServer[serverId];

  if (
    typeof stored === "number" &&
    Number.isFinite(stored)
  ) {
    return clampSlaTarget(stored);
  }

  const legacy =
    slaTargetByServer[LEGACY_DEFAULT_SLA_KEY];

  if (
    typeof legacy === "number" &&
    Number.isFinite(legacy)
  ) {
    return clampSlaTarget(legacy);
  }

  return DEFAULT_SLA_TARGET;
}

export function formatSlaTargetPercent(
  ratio: number,
): string {
  const percent = clampSlaTarget(ratio) * 100;

  if (percent >= 100) {
    return "100 %";
  }

  if (percent >= 99.9) {
    return `${percent.toFixed(2)} %`;
  }

  if (percent >= 99) {
    return `${percent.toFixed(1)} %`;
  }

  return `${Math.round(percent)} %`;
}

export function nearestSlaPreset(
  value: number,
): number {
  const clamped = clampSlaTarget(value);
  let best: number = SLA_TARGET_PRESETS[0];
  let bestDistance = Math.abs(clamped - best);

  for (const preset of SLA_TARGET_PRESETS) {
    const distance = Math.abs(clamped - preset);

    if (distance < bestDistance) {
      best = preset;
      bestDistance = distance;
    }
  }

  return best;
}
