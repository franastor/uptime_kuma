import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";

export type TimelineFilter =
  | "all"
  | "down"
  | "up"
  | "pending"
  | "maintenance";

export function matchesTimelineQuery(
  event: TimelineEvent,
  query: string,
): boolean {
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase("es-ES");

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    event.monitorName,
    event.serverName,
    event.message ?? "",
    event.status,
    String(event.monitorId),
  ];

  return searchableValues.some((value) =>
    value
      .toLocaleLowerCase("es-ES")
      .includes(normalizedQuery),
  );
}

export function matchesTimelineFilter(
  event: TimelineEvent,
  filter: TimelineFilter,
): boolean {
  switch (filter) {
    case "down":
    case "up":
    case "pending":
    case "maintenance":
      return event.status === filter;
    case "all":
    default:
      return true;
  }
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  options: {
    query?: string;
    filter?: TimelineFilter;
    serverId?: string | null;
    monitorId?: number | null;
  },
): TimelineEvent[] {
  const query = options.query ?? "";
  const filter = options.filter ?? "all";

  return events.filter((event) => {
    if (
      options.serverId &&
      event.serverId !== options.serverId
    ) {
      return false;
    }

    if (
      options.monitorId != null &&
      event.monitorId !== options.monitorId
    ) {
      return false;
    }

    return (
      matchesTimelineQuery(event, query) &&
      matchesTimelineFilter(event, filter)
    );
  });
}
