import type {
  KumaHeartbeat,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";
import {
  buildTimelineEventId,
  type TimelineEvent,
} from "@/src/modules/timeline/types/timeline";
import { parseKumaTimestamp } from "@/src/modules/monitor/utils/parseKumaTimestamp";

function normalizeHeartbeatStatus(
  status: number,
): MonitorStatus {
  switch (status) {
    case 0:
      return "down";
    case 1:
      return "up";
    case 2:
      return "pending";
    case 3:
      return "maintenance";
    default:
      return "unknown";
  }
}

export type TimelineHeartbeatContext = {
  serverId: string;
  serverName: string;
  monitorName: string;
  previousStatus?: MonitorStatus | null;
};

export function createTimelineEventFromHeartbeat(
  heartbeat: KumaHeartbeat,
  context: TimelineHeartbeatContext,
  options: {
    requireImportant?: boolean;
  } = {},
): TimelineEvent | null {
  const requireImportant =
    options.requireImportant ?? true;

  if (requireImportant && !heartbeat.important) {
    return null;
  }

  const status = normalizeHeartbeatStatus(
    heartbeat.status,
  );

  if (status === "unknown") {
    return null;
  }

  const createdAt = parseKumaTimestamp(
    heartbeat.time,
  );

  if (createdAt === null) {
    return null;
  }

  return {
    id: buildTimelineEventId(
      context.serverId,
      heartbeat.monitorID,
      heartbeat.time,
      status,
    ),
    serverId: context.serverId,
    serverName: context.serverName,
    monitorId: heartbeat.monitorID,
    monitorName: context.monitorName,
    type: "status_change",
    status,
    previousStatus:
      context.previousStatus ?? null,
    message: heartbeat.msg || null,
    ping:
      typeof heartbeat.ping === "number"
        ? heartbeat.ping
        : null,
    important: heartbeat.important,
    timestamp: heartbeat.time,
    createdAt,
  };
}

export function createTimelineEventsFromMonitorHeartbeats(
  monitorId: number,
  heartbeats: KumaHeartbeat[],
  context: {
    serverId: string;
    serverName: string;
    monitorName: string;
  },
  options: {
    onlyImportant?: boolean;
  } = {},
): TimelineEvent[] {
  const onlyImportant =
    options.onlyImportant ?? true;
  const events: TimelineEvent[] = [];
  let previousStatus: MonitorStatus | null = null;

  const chronological = [...heartbeats].sort(
    (left, right) =>
      (parseKumaTimestamp(left.time) ?? 0) -
      (parseKumaTimestamp(right.time) ?? 0),
  );

  for (const heartbeat of chronological) {
    if (onlyImportant && !heartbeat.important) {
      continue;
    }

    const event =
      createTimelineEventFromHeartbeat(
        {
          ...heartbeat,
          monitorID:
            heartbeat.monitorID || monitorId,
        },
        {
          serverId: context.serverId,
          serverName: context.serverName,
          monitorName: context.monitorName,
          previousStatus,
        },
        {
          requireImportant: false,
        },
      );

    if (event) {
      events.push(event);
      previousStatus = event.status;
    }
  }

  return events;
}
