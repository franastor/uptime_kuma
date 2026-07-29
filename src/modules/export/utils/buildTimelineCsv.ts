import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import {
  buildExportTimestamp,
  rowsToCsv,
  slugifyFilenamePart,
} from "@/src/modules/export/utils/csv";

const TIMELINE_HEADERS = [
  "createdAtIso",
  "timestamp",
  "serverId",
  "serverName",
  "monitorId",
  "monitorName",
  "type",
  "status",
  "previousStatus",
  "pingMs",
  "important",
  "message",
] as const;

export function buildTimelineCsv(
  events: TimelineEvent[],
): string {
  const rows = events.map((event) => [
    new Date(event.createdAt).toISOString(),
    event.timestamp,
    event.serverId,
    event.serverName,
    event.monitorId,
    event.monitorName,
    event.type,
    event.status,
    event.previousStatus,
    event.ping,
    event.important,
    event.message,
  ]);

  return rowsToCsv([...TIMELINE_HEADERS], rows);
}

export function buildTimelineExportFilename(input: {
  serverName: string;
  monitorName?: string | null;
  now?: number;
}): string {
  const stamp = buildExportTimestamp(input.now);
  const server = slugifyFilenamePart(input.serverName);
  const monitor = input.monitorName
    ? `-${slugifyFilenamePart(input.monitorName)}`
    : "";

  return `kumapulse-timeline-${server}${monitor}-${stamp}.csv`;
}
