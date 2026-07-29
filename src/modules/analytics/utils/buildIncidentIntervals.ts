import type { IncidentInterval } from "@/src/modules/analytics/types/analytics";
import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";

function monitorKey(
  serverId: string,
  monitorId: number,
): string {
  return `${serverId}:${monitorId}`;
}

/**
 * Empareja transiciones DOWN → UP del timeline en intervalos de incidencia.
 * Los eventos se procesan en orden cronológico ascendente.
 */
export function buildIncidentIntervals(
  events: TimelineEvent[],
  now = Date.now(),
): IncidentInterval[] {
  const sorted = [...events].sort(
    (left, right) =>
      left.createdAt - right.createdAt,
  );

  const openByMonitor = new Map<
    string,
    IncidentInterval
  >();
  const closed: IncidentInterval[] = [];

  for (const event of sorted) {
    const key = monitorKey(
      event.serverId,
      event.monitorId,
    );

    if (event.status === "down") {
      if (openByMonitor.has(key)) {
        continue;
      }

      openByMonitor.set(key, {
        serverId: event.serverId,
        monitorId: event.monitorId,
        monitorName: event.monitorName,
        serverName: event.serverName,
        start: event.createdAt,
        end: null,
      });
      continue;
    }

    if (
      event.status === "up" ||
      event.status === "maintenance"
    ) {
      const open = openByMonitor.get(key);

      if (!open) {
        continue;
      }

      closed.push({
        ...open,
        end: event.createdAt,
      });
      openByMonitor.delete(key);
    }
  }

  for (const open of openByMonitor.values()) {
    closed.push({
      ...open,
      end: now,
    });
  }

  return closed.sort((left, right) => left.start - right.start);
}
