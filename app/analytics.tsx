import { MaterialIcons } from "@expo/vector-icons";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnalyticsSummaryCards } from "@/src/modules/analytics/components/AnalyticsSummaryCards";
import { AnalyticsWindowSelector } from "@/src/modules/analytics/components/AnalyticsWindowSelector";
import { AvailabilityTrend } from "@/src/modules/analytics/components/AvailabilityTrend";
import { ComparativeCards } from "@/src/modules/analytics/components/ComparativeCards";
import { DowntimeHeatmap } from "@/src/modules/analytics/components/DowntimeHeatmap";
import { HealthScoreCard } from "@/src/modules/analytics/components/HealthScoreCard";
import { InsightsList } from "@/src/modules/analytics/components/InsightsList";
import { LatencyOverview } from "@/src/modules/analytics/components/LatencyOverview";
import { MonitorRankingList } from "@/src/modules/analytics/components/MonitorRankingList";
import { PriorityMonitorsList } from "@/src/modules/analytics/components/PriorityMonitorsList";
import { SlaOverview } from "@/src/modules/analytics/components/SlaOverview";
import { SslCertificatesList } from "@/src/modules/analytics/components/SslCertificatesList";
import { StatusDistributionCard } from "@/src/modules/analytics/components/StatusDistributionCard";
import type {
  AnalyticsWindow,
  MonitorAnalytics,
} from "@/src/modules/analytics/types/analytics";
import {
  buildAnalyticsSummary,
  getAnalyticsWindowLabel,
} from "@/src/modules/analytics/utils/buildAnalyticsSummary";
import { IncidentCard } from "@/src/modules/incidents/components/IncidentCard";
import { getActiveIncidents } from "@/src/modules/incidents/utils/getActiveIncidents";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { resolveSlaTarget } from "@/src/modules/settings/types/appSettings";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import { MonitorTimeline } from "@/src/modules/timeline/components/MonitorTimeline";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type DashboardSection =
  | "health"
  | "summary"
  | "availability"
  | "latency"
  | "status"
  | "priority"
  | "incidents"
  | "sla"
  | "comparatives"
  | "availability-ranking"
  | "latency-ranking"
  | "ssl"
  | "heatmap"
  | "activity"
  | "insights";

const DASHBOARD_SECTIONS: {
  id: DashboardSection;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { id: "health", label: "Health Score", icon: "monitor-heart" },
  { id: "summary", label: "Resumen", icon: "dashboard" },
  { id: "availability", label: "Disponibilidad", icon: "show-chart" },
  { id: "latency", label: "Latencia", icon: "speed" },
  { id: "status", label: "Estados", icon: "donut-large" },
  { id: "priority", label: "Prioritarios", icon: "priority-high" },
  { id: "incidents", label: "Incidencias", icon: "error-outline" },
  { id: "sla", label: "SLA", icon: "verified" },
  { id: "comparatives", label: "Comparativas", icon: "compare-arrows" },
  {
    id: "availability-ranking",
    label: "Ranking uptime",
    icon: "format-list-numbered",
  },
  {
    id: "latency-ranking",
    label: "Ranking latencia",
    icon: "network-check",
  },
  { id: "ssl", label: "SSL", icon: "verified-user" },
  { id: "heatmap", label: "Heatmap", icon: "grid-view" },
  { id: "activity", label: "Actividad", icon: "timeline" },
  { id: "insights", label: "Insights", icon: "lightbulb" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const params = useLocalSearchParams<{
    serverId?: string | string[];
  }>();
  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;

  const [window, setWindow] =
    useState<AnalyticsWindow>("24h");
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("health");

  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const hasAdvancedDashboard = canUseFeature(
    plan,
    "advanced-dashboard",
  );

  const server = useServerStore((state) =>
    state.servers.find(
      (item) => item.id === serverId,
    ),
  );
  const monitorsByServer = useMonitorStore(
    (state) => state.monitorsByServer,
  );
  const statsByMonitor = useMonitorStatsStore(
    (state) => state.statsByMonitor,
  );
  const heartbeatsByMonitor =
    useHeartbeatHistoryStore(
      (state) => state.recordsByMonitor,
    );
  const events = useTimelineStore(
    (state) => state.events,
  );
  const slaTargetByServer = useAppSettingsStore(
    (state) => state.slaTargetByServer,
  );

  const serverMonitors = useMemo(() => {
    if (!serverId) {
      return [];
    }

    return monitorsByServer[serverId] ?? [];
  }, [monitorsByServer, serverId]);

  const monitors = useMemo(() => {
    if (!serverId || !server) {
      return [];
    }

    return serverMonitors.map((monitor) => ({
      serverId,
      serverName: server.name,
      monitor,
    }));
  }, [server, serverId, serverMonitors]);

  const summary = useMemo(
    () =>
      buildAnalyticsSummary({
        events,
        monitors,
        statsByMonitor,
        heartbeatsByMonitor,
        window,
        serverId: serverId ?? null,
        resolveSlaTarget: (id) =>
          resolveSlaTarget(
            slaTargetByServer,
            id,
          ),
      }),
    [
      events,
      heartbeatsByMonitor,
      monitors,
      serverId,
      slaTargetByServer,
      statsByMonitor,
      window,
    ],
  );

  const activeIncidents = useMemo(
    () => getActiveIncidents(serverMonitors),
    [serverMonitors],
  );

  const recentEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.serverId === serverId,
        )
        .slice(0, 8),
    [events, serverId],
  );

  const openMonitor = (
    monitor: MonitorAnalytics,
  ) => {
    router.push({
      pathname: "/monitor/[serverId]/[monitorId]",
      params: {
        serverId: monitor.serverId,
        monitorId: String(monitor.monitorId),
      },
    });
  };

  if (!serverId || !server) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Dashboard avanzado",
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
            El dashboard avanzado solo tiene
            sentido dentro de una instancia de
            Uptime Kuma.
          </Text>
          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </Screen>
      </>
    );
  }

  if (!hasAdvancedDashboard) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Dashboard avanzado",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Screen contentContainerStyle={styles.centered}>
          <View style={styles.lockIcon}>
            <MaterialIcons
              name="workspace-premium"
              size={36}
              color={colors.background}
            />
          </View>
          <Text style={styles.notFoundTitle}>
            Función Premium
          </Text>
          <Text style={styles.notFoundDescription}>
            Health Score, SLA, rankings, heatmap,
            MTTR/MTBF, SSL, comparativas e insights
            forman parte del Dashboard avanzado.
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
          title: "Dashboard avanzado",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>
            Dashboard avanzado
          </Text>
          <Text style={styles.subtitle}>
            {server.name} ·{" "}
            {getAnalyticsWindowLabel(window)}
          </Text>
        </View>

        <AnalyticsWindowSelector
          value={window}
          onChange={setWindow}
        />

        {summary.hasLimitedHistory ? (
          <View style={styles.notice}>
            <MaterialIcons
              name="info-outline"
              size={18}
              color={colors.warning}
            />
            <Text style={styles.noticeText}>
              Parte de las métricas se estiman con
              el histórico local. Con pocos eventos
              el periodo puede ser incompleto.
            </Text>
          </View>
        ) : null}

        <View style={styles.moduleGrid}>
          {DASHBOARD_SECTIONS.map((item) => {
            const selected = item.id === activeSection;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveSection(item.id)}
                style={({ pressed }) => [
                  styles.moduleButton,
                  selected
                    ? styles.moduleButtonSelected
                    : null,
                  pressed
                    ? styles.moduleButtonPressed
                    : null,
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={
                    selected
                      ? colors.background
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.moduleButtonText,
                    selected
                      ? styles.moduleButtonTextSelected
                      : null,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSection === "health" ? (
        <Section title="Health Score">
          <HealthScoreCard
            score={summary.healthScore}
          />
        </Section>
        ) : null}

        {activeSection === "summary" ? (
        <Section title="Resumen ejecutivo">
          <AnalyticsSummaryCards
            summary={summary}
          />
        </Section>
        ) : null}

        {activeSection === "availability" ? (
        <Section
          title="Disponibilidad"
          description="24 h, 7 días, 30 días y 90 días"
        >
          <AvailabilityTrend
            points={summary.availabilityTrend}
          />
        </Section>
        ) : null}

        {activeSection === "latency" ? (
        <Section
          title="Latencia"
          description="Media, picos, P95 y comparación con el periodo anterior"
        >
          <LatencyOverview
            latency={summary.latency}
          />
        </Section>
        ) : null}

        {activeSection === "status" ? (
        <Section
          title="Distribución por estado"
          description="UP, DOWN, pendiente, pausado y desconocido"
        >
          <StatusDistributionCard
            distribution={
              summary.statusDistribution
            }
          />
        </Section>
        ) : null}

        {activeSection === "priority" ? (
        <Section
          title="Monitores prioritarios"
          description="Requieren atención inmediata"
        >
          <PriorityMonitorsList
            monitors={summary.priorityMonitors}
            onPressMonitor={openMonitor}
          />
        </Section>
        ) : null}

        {activeSection === "incidents" ? (
        <Section
          title="Incidencias activas"
          description="Detalle con acceso rápido al monitor"
        >
          {activeIncidents.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay incidencias activas ahora
              mismo.
            </Text>
          ) : (
            <View style={styles.incidentList}>
              {activeIncidents
                .slice(0, 5)
                .map((incident) => (
                  <IncidentCard
                    key={incident.monitor.id}
                    incident={incident}
                    onPress={() =>
                      router.push({
                        pathname:
                          "/monitor/[serverId]/[monitorId]",
                        params: {
                          serverId,
                          monitorId: String(
                            incident.monitor.id,
                          ),
                        },
                      })
                    }
                  />
                ))}
            </View>
          )}
        </Section>
        ) : null}

        {activeSection === "sla" ? (
        <Section
          title="SLA"
          description="El objetivo se configura en los ajustes de este servidor"
        >
          <SlaOverview
            summary={summary}
            onPressMonitor={openMonitor}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname:
                  "/monitor/[serverId]/settings",
                params: { serverId },
              })
            }
            style={({ pressed }) => [
              styles.settingsLink,
              pressed
                ? styles.settingsLinkPressed
                : null,
            ]}
          >
            <Text style={styles.settingsLinkText}>
              Cambiar objetivo SLA
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </Section>
        ) : null}

        {activeSection === "comparatives" ? (
        <Section
          title="Comparativas"
          description="Respecto al periodo anterior de la misma duración"
        >
          <ComparativeCards
            comparative={summary.comparative}
          />
        </Section>
        ) : null}

        {activeSection === "availability-ranking" ? (
        <Section
          title="Ranking · peor disponibilidad"
          description="Más downtime e incidencias primero"
        >
          <MonitorRankingList
            ranking={summary.ranking}
            mode="availability"
            onPressMonitor={openMonitor}
          />
        </Section>
        ) : null}

        {activeSection === "latency-ranking" ? (
        <Section
          title="Ranking · mayor latencia"
          description="Ping medio más alto primero"
        >
          <MonitorRankingList
            ranking={summary.latencyRanking}
            mode="latency"
            onPressMonitor={openMonitor}
          />
        </Section>
        ) : null}

        {activeSection === "ssl" ? (
        <Section
          title="SSL"
          description="Estado de certificados y próximos vencimientos"
        >
          <SslCertificatesList
            certificates={
              summary.sslCertificates
            }
            onPressMonitor={(certificate) =>
              router.push({
                pathname:
                  "/monitor/[serverId]/[monitorId]",
                params: {
                  serverId: certificate.serverId,
                  monitorId: String(
                    certificate.monitorId,
                  ),
                },
              })
            }
          />
        </Section>
        ) : null}

        {activeSection === "heatmap" ? (
        <Section
          title="Heatmap de caídas"
          description="Intensidad según minutos DOWN por día y hora"
        >
          <DowntimeHeatmap
            cells={summary.heatmap}
          />
        </Section>
        ) : null}

        {activeSection === "activity" ? (
        <Section
          title="Actividad reciente"
          description="Timeline de cambios importantes"
        >
          {recentEvents.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no hay eventos en el
              timeline de este servidor.
            </Text>
          ) : (
            <MonitorTimeline
              events={recentEvents}
              limit={8}
            />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/timeline",
                params: { serverId },
              })
            }
            style={({ pressed }) => [
              styles.settingsLink,
              pressed
                ? styles.settingsLinkPressed
                : null,
            ]}
          >
            <Text style={styles.settingsLinkText}>
              Ver timeline completo
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </Section>
        ) : null}

        {activeSection === "insights" ? (
        <Section
          title="Insights"
          description="Recomendaciones automáticas a partir de los datos locales"
        >
          <InsightsList
            insights={summary.insights}
          />
        </Section>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
    alignItems: "center",
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
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
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  noticeText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  moduleButton: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  moduleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  moduleButtonPressed: {
    opacity: 0.75,
  },
  moduleButtonText: {
    ...typography.caption,
    flex: 1,
    color: colors.text,
    fontWeight: "700",
  },
  moduleButtonTextSelected: {
    color: colors.background,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  incidentList: {
    gap: spacing.md,
  },
  settingsLink: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  settingsLinkPressed: {
    opacity: 0.7,
  },
  settingsLinkText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});
