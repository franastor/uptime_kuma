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

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;

    async function refresh(): Promise<void> {
      setRefreshing(true);

      try {
        if (serverId) {
          await kumaService.refreshTimelineHistory(
            serverId,
            resolvedMonitorId,
          );
          return;
        }

        const connectedServers =
          useServerStore
            .getState()
            .servers.filter((server) =>
              kumaService.isConnected(server.id),
            );

        await Promise.all(
          connectedServers.map((server) =>
            kumaService.refreshTimelineHistory(
              server.id,
              null,
            ),
          ),
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
    : serverId
      ? "Timeline del servidor"
      : "Timeline";

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
          Historial en caché local, actualizado en
          segundo plano con los eventos importantes de
          Uptime Kuma.
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
                : "Conéctate al servidor para rellenar la caché. Luego los eventos se mostrarán al instante."}
            </Text>
          </View>
        ) : (
          resolvedMonitorId !== null ? (
            <View style={styles.timelineCard}>
              <MonitorTimeline
                events={visibleEvents}
                limit={visibleEvents.length}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {visibleEvents.map((event) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  onPress={() => {
                    router.push({
                      pathname:
                        "/monitor/[serverId]/[monitorId]",
                      params: {
                        serverId:
                          event.serverId,
                        monitorId: String(
                          event.monitorId,
                        ),
                      },
                    });
                  }}
                />
              ))}
            </View>
          )
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
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
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  timelineCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: "center",
  },
  emptyDescription: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
