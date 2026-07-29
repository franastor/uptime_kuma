import {
  DEFAULT_SLA_TARGET,
  type SlaStatus,
} from "@/src/modules/analytics/types/analytics";

/** Fracción del presupuesto de error a partir de la cual avisamos. */
const AT_RISK_BUDGET_RATIO = 0.75;

/**
 * Presupuesto de error consumido (0 = intacto, 1 = agotado).
 * Con objetivo 99 % se permite un 1 % de caída: un uptime del
 * 99,7 % consume el 30 % del presupuesto.
 */
export function computeErrorBudgetUsed(
  uptimeRatio: number | null,
  target = DEFAULT_SLA_TARGET,
): number | null {
  if (
    uptimeRatio === null ||
    !Number.isFinite(uptimeRatio) ||
    !Number.isFinite(target)
  ) {
    return null;
  }

  const budget = 1 - target;

  if (budget <= 0) {
    return uptimeRatio >= 1 ? 0 : 1;
  }

  return Math.max(
    0,
    (1 - uptimeRatio) / budget,
  );
}

export function computeSlaStatus(
  uptimeRatio: number | null,
  target = DEFAULT_SLA_TARGET,
): SlaStatus {
  const used = computeErrorBudgetUsed(
    uptimeRatio,
    target,
  );

  if (used === null || uptimeRatio === null) {
    return "unknown";
  }

  if (uptimeRatio < target) {
    return "breached";
  }

  if (used >= AT_RISK_BUDGET_RATIO) {
    return "at_risk";
  }

  return "met";
}

export function estimateUptimeFromDowntime(
  downtimeMs: number,
  windowMs: number,
): number | null {
  if (windowMs <= 0) {
    return null;
  }

  const ratio = 1 - downtimeMs / windowMs;

  if (!Number.isFinite(ratio)) {
    return null;
  }

  return Math.max(0, Math.min(1, ratio));
}
