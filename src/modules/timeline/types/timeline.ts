import type { MonitorStatus } from "@/src/modules/monitor/types/monitor";

export type TimelineEventType =
  | "status_change"
  | "heartbeat";

export type TimelineEvent = {
  id: string;
  serverId: string;
  serverName: string;
  monitorId: number;
  monitorName: string;
  type: TimelineEventType;
  status: MonitorStatus;
  previousStatus: MonitorStatus | null;
  message: string | null;
  ping: number | null;
  important: boolean;
  timestamp: string;
  createdAt: number;
};

export const MAX_TIMELINE_EVENTS = 500;

export function buildTimelineEventId(
  serverId: string,
  monitorId: number,
  timestamp: string,
  status: MonitorStatus,
): string {
  return `${serverId}:${monitorId}:${timestamp}:${status}`;
}
