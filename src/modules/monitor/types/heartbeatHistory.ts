import type { MonitorStatus } from "@/src/modules/monitor/types/monitor";

export type MonitorHeartbeatRecord = {
  id: string;
  serverId: string;
  monitorId: number;
  status: MonitorStatus;
  ping: number | null;
  message: string | null;
  important: boolean;
  retries: number;
  timestamp: string;
  createdAt: number;
};

export const MAX_HEARTBEATS_PER_MONITOR = 100;

export function buildHeartbeatRecordKey(
  serverId: string,
  monitorId: number,
): string {
  return `${serverId}:${monitorId}`;
}

export function buildHeartbeatRecordId(
  serverId: string,
  monitorId: number,
  timestamp: string,
  status: MonitorStatus,
): string {
  return `${serverId}:${monitorId}:${timestamp}:${status}`;
}
