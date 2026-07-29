import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { kumaService } from "@/src/core/services/KumaService";
import { TimelineEventCard } from "@/src/modules/timeline/components/TimelineEventCard";
import { TimelineFilters } from "@/src/modules/timeline/components/TimelineFilters";
import { MonitorTimeline } from "@/src/modules/timeline/components/MonitorTimeline";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import {
  filterTimelineEvents,
  type TimelineFilter,
} from "@/src/modules/timeline/utils/filterTimelineEvents";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import { colors, spacing, typography } from "@/src/shared/theme";

export default function TimelineScreen() {
  const params = useLocalSearchParams<{
    serverId?: string | string[];
    monitorId?: string | string[];
    monitorName?: string | string[];
  }>();

  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;
  const monitorIdRaw = Array.isArray(params.monitorId)
    ? params.monitorId[0]
    : params.monitorId;
  const monitorNameParam = Array.isArray(
    params.monitorName,
  )
    ? params.monitorName[0]
    : params.monitorName;

  const monitorId = monitorIdRaw
    ? Number(monitorIdRaw)
    : null;
  const resolvedMonitorId =
    monitorId !== null && Number.isFinite(monitorId)
      ? monitorId
      : null;

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<TimelineFilter>("all");
  const [refreshing, setRefreshing] =
    useState(false);

  const hydrate = useTimelineStore(
    (state) => state.hydrate,
  );
  const hydrated = useTimelineStore(
    (state) => state.hydrated,
  );
  const events = useTimelineStore(
    (state) => state.events,
  );
  const server = useServerStore((state) =>
    state.servers.find(
      (item) => item.id === serverId,
    ),
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!serverId) {
      return;
    }

    let cancelled = false;

    async function refresh(): Promise<void> {
      setRefreshing(true);

      try {
        await kumaService.refreshTimelineHistory(
          serverId!,
          resolvedMonitorId,
        );
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [resolvedMonitorId, serverId]);

  const visibleEvents = useMemo(
    () =>
      filterTimelineEvents(events, {
        query,
        filter,
        serverId: serverId ?? null,
        monitorId: resolvedMonitorId,
      }),
    [
      events,
      filter,
      query,
      resolvedMonitorId,
      serverId,
    ],
  );

  const title = resolvedMonitorId
    ? monitorNameParam ||
      `Monitor ${resolvedMonitorId}`
    : server
      ? `Timeline · ${server.name}`
      : "Timeline";

  if (!serverId || !server) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Timeline",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Screen contentContainerStyle={styles.centered}>
          <Text style={styles.notFoundTitle}>
            Elige un servidor
          </Text>
          <Text style={styles.notFoundDescription}>
            El timeline solo tiene sentido dentro
            de una instancia de Uptime Kuma.
          </Text>
          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <Text style={styles.description}>
          Historial de {server.name}, en caché
          local y actualizado en segundo plano.
        </Text>

        {refreshing ? (
          <View style={styles.refreshRow}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
            <Text style={styles.refreshText}>
              Actualizando histórico...
            </Text>
          </View>
        ) : null}

        <TimelineFilters
          query={query}
          filter={filter}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
        />

        <Text style={styles.count}>
          {visibleEvents.length} evento
          {visibleEvents.length === 1 ? "" : "s"}
        </Text>

        {!hydrated ? (
          <Text style={styles.emptyDescription}>
            Cargando timeline...
          </Text>
        ) : visibleEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons
              name="timeline"
              size={34}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              Sin eventos todavía
            </Text>
            <Text style={styles.emptyDescription}>
              {refreshing
                ? "Estamos pidiendo el histórico a Uptime Kuma..."
                : "Cuando haya cambios importantes de estado aparecerán aquí."}
            </Text>
          </View>
        ) : resolvedMonitorId ? (
          <View style={styles.timelineCard}>
            <MonitorTimeline
              events={visibleEvents}
              limit={40}
            />
          </View>
        ) : (
          visibleEvents.map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              onPress={() => {
                router.push({
                  pathname:
                    "/monitor/[serverId]/[monitorId]",
                  params: {
                    serverId: event.serverId,
                    monitorId: String(
                      event.monitorId,
                    ),
                  },
                });
              }}
            />
          ))
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  notFoundTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  notFoundDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  refreshText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  emptyDescription: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
});
