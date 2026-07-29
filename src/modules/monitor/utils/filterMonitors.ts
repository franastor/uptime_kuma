import type { Monitor } from "@/src/modules/monitor/types/monitor";

export function getMonitorTagKeys(
  monitor: Monitor,
): string[] {
  return monitor.tags.map((tag) =>
    tag.value ? `${tag.name}:${tag.value}` : tag.name,
  );
}

export function collectAvailableTags(
  monitors: Monitor[],
): string[] {
  const tags = new Set<string>();

  for (const monitor of monitors) {
    for (const key of getMonitorTagKeys(monitor)) {
      const trimmed = key.trim();

      if (trimmed) {
        tags.add(trimmed);
      }
    }
  }

  return [...tags].sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

export function matchesMonitorQuery(
  monitor: Monitor,
  query: string,
): boolean {
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase("es-ES");

  if (!normalizedQuery) {
    return true;
  }

  const tagKeys = getMonitorTagKeys(monitor);
  const searchableValues = [
    monitor.name,
    monitor.target ?? "",
    monitor.description ?? "",
    ...tagKeys,
    ...monitor.tags.flatMap((tag) => [
      tag.name,
      tag.value ?? "",
    ]),
  ];

  return searchableValues.some((value) =>
    value.toLocaleLowerCase("es-ES").includes(normalizedQuery),
  );
}

/** OR: basta con que el monitor tenga alguna de las etiquetas. */
export function matchesSelectedTags(
  monitor: Monitor,
  selectedTags: string[],
): boolean {
  if (selectedTags.length === 0) {
    return true;
  }

  const keys = new Set(
    getMonitorTagKeys(monitor).map((key) =>
      key.toLocaleLowerCase("es-ES"),
    ),
  );

  return selectedTags.some((tag) =>
    keys.has(tag.toLocaleLowerCase("es-ES")),
  );
}
