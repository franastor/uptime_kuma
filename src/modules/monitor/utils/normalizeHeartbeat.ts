import type { KumaHeartbeat } from "@/src/modules/monitor/types/monitor";

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }

  return false;
}

/**
 * Uptime Kuma may send camelCase (toJSON) or snake_case (raw SQL rows).
 */
export function normalizeKumaHeartbeat(
  payload: unknown,
  fallbackMonitorId?: number,
): KumaHeartbeat | null {
  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return null;
  }

  const candidate = payload as Record<
    string,
    unknown
  >;

  const monitorId =
    toNumber(candidate.monitorID) ??
    toNumber(candidate.monitor_id) ??
    (fallbackMonitorId !== undefined
      ? fallbackMonitorId
      : null);

  const status = toNumber(candidate.status);
  const time =
    typeof candidate.time === "string"
      ? candidate.time
      : null;

  if (
    monitorId === null ||
    status === null ||
    !time
  ) {
    return null;
  }

  const ping = toNumber(candidate.ping);

  return {
    monitorID: monitorId,
    status,
    time,
    msg:
      typeof candidate.msg === "string"
        ? candidate.msg
        : "",
    ping: ping ?? 0,
    important: toBoolean(candidate.important),
    retries: toNumber(candidate.retries) ?? 0,
  };
}

export function normalizeKumaHeartbeatList(
  payloads: unknown,
  monitorId: number,
): KumaHeartbeat[] {
  if (!Array.isArray(payloads)) {
    return [];
  }

  return payloads
    .map((item) =>
      normalizeKumaHeartbeat(item, monitorId),
    )
    .filter(
      (item): item is KumaHeartbeat =>
        item !== null,
    );
}
