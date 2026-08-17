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
import { ExportButton } from "@/src/modules/export/components/ExportButton";
import {
  ExportUnavailableError,
  exportTimelineExcel,
} from "@/src/modules/export";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import { TimelineEventCard } from "@/src/modules/timeline/components/TimelineEventCard";
import { TimelineFilters } from "@/src/modules/timeline/components/TimelineFilters";
import { MonitorTimeline } from "@/src/modules/timeline/components/MonitorTimeline";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import {
  filterTimelineEvents,
  type TimelineFilter,
} from "@/src/modules/timeline/utils/filterTimelineEvents";
import { AppButton } from "@/src/shared/components/AppButton";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { Screen } from "@/src/shared/components/Screen";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import { colors, spacing, typography } from "@/src/shared/theme";

export default function TimelineScreen() {
  const { t, resolvedLocale } = useTranslation();
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
  const [exporting, setExporting] = useState(false);
  const [showPremiumModal, setShowPremiumModal] =
    useState(false);
  const [exportError, setExportError] = useState<
    string | null
  >(null);
  const [exportSuccess, setExportSuccess] = useState<
    string | null
  >(null);

  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const canExport = canUseFeature(plan, "data-export");

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

  const handleExport = async () => {
    if (!server) {
      return;
    }

    if (!canExport) {
      setShowPremiumModal(true);
      return;
    }

    setExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const saved = await exportTimelineExcel({
        events: visibleEvents,
        serverName: server.name,
        locale: resolvedLocale,
        monitorName:
          resolvedMonitorId != null
            ? monitorNameParam ||
              `monitor-${resolvedMonitorId}`
            : null,
      });
      setExportSuccess(
        t("export.savedIn", { filename: saved.filename }),
      );
    } catch (error) {
      const message =
        error instanceof ExportUnavailableError ||
        error instanceof Error
          ? error.message
          : "No se pudo exportar el timeline.";
      setExportError(message);
    } finally {
      setExporting(false);
    }
  };

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

        <ExportButton
          title={
            canExport
              ? t("timeline.exportCsv")
              : t("timeline.exportCsvPremium")
          }
          description={
            canExport
              ? t("timeline.exportHint")
              : t("timeline.exportPremiumHint")
          }
          locked={!canExport}
          loading={exporting}
          onPress={() => {
            void handleExport();
          }}
        />

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

      <ConfirmModal
        visible={showPremiumModal}
        title={t("common.premiumFeature")}
        description={t("timeline.exportPremiumDescription")}
        confirmLabel={t("common.understood")}
        cancelLabel={null}
        onConfirm={() => setShowPremiumModal(false)}
        onCancel={() => setShowPremiumModal(false)}
      />

      <ConfirmModal
        visible={exportError != null}
        title={t("timeline.exportFailed")}
        description={exportError ?? ""}
        confirmLabel={t("common.understood")}
        cancelLabel={null}
        onConfirm={() => setExportError(null)}
        onCancel={() => setExportError(null)}
      />

      <ConfirmModal
        visible={exportSuccess != null}
        title={t("timeline.exportSaved")}
        description={exportSuccess ?? ""}
        confirmLabel={t("common.understood")}
        cancelLabel={null}
        onConfirm={() => setExportSuccess(null)}
        onCancel={() => setExportSuccess(null)}
      />
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
