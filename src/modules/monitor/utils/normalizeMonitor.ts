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

export function normalizeMonitor(
  monitor: KumaMonitor,
): Monitor {
  return {
    id: monitor.id,
    name: monitor.name,
    type: monitor.type,
    target: getMonitorTarget(monitor),
    interval: monitor.interval ?? null,
    active: monitor.active ?? true,
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
