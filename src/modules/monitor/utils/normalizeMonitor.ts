import type {
  KumaMonitor,
  KumaMonitorTag,
  Monitor,
  MonitorTag,
} from "@/src/modules/monitor/types/monitor";

function getMonitorTarget(
  monitor: KumaMonitor,
): string | null {
  if (monitor.url) {
    return monitor.url;
  }

  if (monitor.hostname && monitor.port) {
    return `${monitor.hostname}:${monitor.port}`;
  }

  if (monitor.hostname) {
    return monitor.hostname;
  }

  return null;
}

function normalizeTag(
  tag: KumaMonitorTag,
  index: number,
): MonitorTag | null {
  const name = tag.name?.trim();

  if (!name) {
    return null;
  }

  return {
    id: tag.tag_id ?? tag.id ?? `${name}-${index}`,
    name,
    color: tag.color ?? null,
    value: tag.value?.trim() || null,
  };
}

function normalizeTags(
  tags: KumaMonitorTag[] | undefined,
): MonitorTag[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map(normalizeTag)
    .filter(
      (tag): tag is MonitorTag => tag !== null,
    );
}

/**
 * Uptime Kuma envía `active` como booleano o como 0/1 según la versión.
 */
function isMonitorActive(
  value: KumaMonitor["active"],
): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return value !== "0" && value.toLowerCase() !== "false";
}

function isKumaMonitorLike(
  value: unknown,
): value is KumaMonitor {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return (
    Number.isFinite(Number(candidate.id)) &&
    typeof candidate.name === "string"
  );
}

/**
 * `monitorList` llega como diccionario por id y `updateMonitorIntoList`
 * puede llegar como diccionario o como monitor suelto según la versión.
 */
export function normalizeMonitorList(
  payload: unknown,
): Monitor[] {
  if (Array.isArray(payload)) {
    return payload
      .filter(isKumaMonitorLike)
      .map(normalizeMonitor);
  }

  if (isKumaMonitorLike(payload)) {
    return [normalizeMonitor(payload)];
  }

  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return [];
  }

  return Object.values(payload)
    .filter(isKumaMonitorLike)
    .map(normalizeMonitor);
}

export function normalizeMonitor(
  monitor: KumaMonitor,
): Monitor {
  return {
    id: Number(monitor.id),
    name: monitor.name,
    type: monitor.type,
    target: getMonitorTarget(monitor),
    interval: monitor.interval ?? null,
    active: isMonitorActive(monitor.active),
    description: monitor.description ?? null,
    tags: normalizeTags(monitor.tags),
    status: "unknown",
    ping: null,
    message: null,
    uptime: null,
    lastHeartbeatAt: null,
    duration: null,
    retries: 0,
    important: false,
    previousStatus: null,
  };
}
