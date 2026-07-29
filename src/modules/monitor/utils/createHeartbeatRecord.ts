import type {
  KumaHeartbeat,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";
import {
  buildHeartbeatRecordId,
  type MonitorHeartbeatRecord,
} from "@/src/modules/monitor/types/heartbeatHistory";
import { parseKumaTimestamp } from "@/src/modules/monitor/utils/parseKumaTimestamp";

function normalizeStatus(
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

export function createHeartbeatRecord(
  serverId: string,
  heartbeat: KumaHeartbeat,
): MonitorHeartbeatRecord | null {
  const status = normalizeStatus(heartbeat.status);

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
    id: buildHeartbeatRecordId(
      serverId,
      heartbeat.monitorID,
      heartbeat.time,
      status,
    ),
    serverId,
    monitorId: heartbeat.monitorID,
    status,
    ping:
      Number.isFinite(heartbeat.ping)
        ? heartbeat.ping
        : null,
    message: heartbeat.msg || null,
    important: heartbeat.important,
    retries: heartbeat.retries,
    timestamp: heartbeat.time,
    createdAt,
  };
}
