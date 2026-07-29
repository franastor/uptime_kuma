import { MaterialIcons } from "@expo/vector-icons";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import { useEffect, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { kumaService } from "@/src/core/services/KumaService";
import { IncidentCard } from "@/src/modules/incidents/components/IncidentCard";
import { getActiveIncidents } from "@/src/modules/incidents/utils/getActiveIncidents";
import { MonitorStatusBadge } from "@/src/modules/monitor/components/MonitorStatusBadge";
import { MonitorAvailabilityGrid } from "@/src/modules/monitor/components/MonitorAvailabilityGrid";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import {
  buildMonitorStatsKey,
  useMonitorStatsStore,
} from "@/src/modules/monitor/store/monitorStats.store";
import {
  buildHeartbeatRecordKey,
  type MonitorHeartbeatRecord,
} from "@/src/modules/monitor/types/heartbeatHistory";
import {
  formatHeartbeatDate,
  getMonitorStatusInformation,
  getMonitorTypeLabel,
} from "@/src/modules/monitor/utils/monitorPresentation";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { MonitorTimeline } from "@/src/modules/timeline/components/MonitorTimeline";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

function calculateUptime(
  records: MonitorHeartbeatRecord[],
): number | null {
  const measurable = records.filter(
    (record) =>
      record.status === "up" ||
      record.status === "down",
  );

  if (measurable.length === 0) {
    return null;
  }

  const up = measurable.filter(
    (record) => record.status === "up",
  ).length;

  return (up / measurable.length) * 100;
}

function calculateAveragePing(
  records: MonitorHeartbeatRecord[],
): number | null {
  const pings = records
    .filter(
      (record) =>
        record.status === "up" &&
        record.ping !== null,
    )
    .map((record) => record.ping as number);

  if (pings.length === 0) {
    return null;
  }

  return Math.round(
    pings.reduce(
      (total, ping) => total + ping,
      0,
    ) / pings.length,
  );
}

function formatUptime(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  const percent =
    value <= 1 ? value * 100 : value;

  return `${percent.toFixed(
    percent >= 100 ? 0 : 2,
  )} %`;
}

function formatDowntime24h(
  uptime: number | null,
): string {
  if (uptime === null) {
    return "—";
  }

  const ratio =
    uptime > 1 ? uptime / 100 : uptime;
  const minutes = Math.max(
    0,
    Math.round((1 - ratio) * 24 * 60),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder > 0
    ? `${hours} h ${remainder} min`
    : `${hours} h`;
}

function getHeartbeatColor(
  status: MonitorHeartbeatRecord["status"],
): string {
  switch (status) {
    case "up":
      return colors.success;
    case "down":
      return colors.danger;
    case "pending":
      return colors.warning;
    case "maintenance":
      return colors.info;
    default:
      return colors.textMuted;
  }
}

function getHeartbeatLabel(
  status: MonitorHeartbeatRecord["status"],
): string {
  switch (status) {
    case "up":
      return "UP";
    case "down":
      return "DOWN";
    case "pending":
      return "PENDING";
    case "maintenance":
      return "MANT.";
    default:
      return "—";
  }
}

type MetricProps = {
  icon:
    | "speed"
    | "query-stats"
    | "percent"
    | "error-outline"
    | "timer-off"
    | "fact-check"
    | "verified-user";
  label: string;
  value: string;
  helper: string;
  color: string;
};

function Metric({
  icon,
  label,
  value,
  helper,
  color,
}: MetricProps) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <MaterialIcons
          name={icon}
          size={18}
          color={color}
        />
        <Text style={styles.metricLabel}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.metricValue,
          { color },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.metricHelper}>
        {helper}
      </Text>
    </View>
  );
}

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

export default function MonitorDetailScreen() {
  const params = useLocalSearchParams<{
    serverId?: string | string[];
    monitorId?: string | string[];
  }>();
  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;
  const monitorIdRaw = Array.isArray(
    params.monitorId,
  )
    ? params.monitorId[0]
    : params.monitorId;
  const monitorId = Number(monitorIdRaw);
  const validMonitorId =
    Number.isFinite(monitorId);

  const server = useServerStore((state) =>
    state.servers.find(
      (item) => item.id === serverId,
    ),
  );
  const monitor = useMonitorStore((state) =>
    serverId && validMonitorId
      ? state.monitorsByServer[serverId]?.find(
          (item) => item.id === monitorId,
        )
      : undefined,
  );
  const heartbeatKey =
    serverId && validMonitorId
      ? buildHeartbeatRecordKey(
          serverId,
          monitorId,
        )
      : "";
  const statsKey =
    serverId && validMonitorId
      ? buildMonitorStatsKey(
          serverId,
          monitorId,
        )
      : "";
  const heartbeats = useHeartbeatHistoryStore(
    (state) =>
      heartbeatKey
        ? state.recordsByMonitor[
            heartbeatKey
          ] ?? []
        : [],
  );
  const serverStats = useMonitorStatsStore(
    (state) =>
      statsKey
        ? state.statsByMonitor[statsKey]
        : undefined,
  );
  const allEvents = useTimelineStore(
    (state) => state.events,
  );

  useEffect(() => {
    if (!serverId || !validMonitorId) {
      return;
    }

    void kumaService.refreshTimelineHistory(
      serverId,
      monitorId,
    );
  }, [monitorId, serverId, validMonitorId]);

  const events = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          event.serverId === serverId &&
          event.monitorId === monitorId,
      ),
    [allEvents, monitorId, serverId],
  );
  const availabilitySamples = useMemo(
    () => [
      ...heartbeats.map((heartbeat) => ({
        timestamp: heartbeat.createdAt,
        status: heartbeat.status,
      })),
      ...events.map((event) => ({
        timestamp: event.createdAt,
        status: event.status,
      })),
    ],
    [events, heartbeats],
  );
  const uptime = calculateUptime(heartbeats);
  const localAveragePing =
    calculateAveragePing(heartbeats);
  const averagePing =
    serverStats?.averagePing24h ??
    localAveragePing;
  const incidents = events.filter(
    (event) => event.status === "down",
  ).length;
  const activeIncident = monitor
    ? getActiveIncidents([monitor])[0] ?? null
    : null;
  const status = monitor
    ? getMonitorStatusInformation(monitor)
    : null;

  if (
    !serverId ||
    !validMonitorId ||
    !server ||
    !monitor
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Monitor",
            headerShown: true,
            headerStyle: {
              backgroundColor:
                colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Screen
          contentContainerStyle={
            styles.centered
          }
        >
          <Text style={styles.notFoundTitle}>
            Monitor no encontrado
          </Text>
          <Text
            style={styles.notFoundDescription}
          >
            Conéctate al servidor para cargar sus
            datos.
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
          title: monitor.name,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <View
          style={[
            styles.statusCard,
            {
              borderColor:
                status?.color ?? colors.border,
            },
          ]}
        >
          <View style={styles.statusCardHeader}>
            <View style={styles.statusIdentity}>
              <Text style={styles.monitorName}>
                {monitor.name}
              </Text>
              <Text style={styles.monitorType}>
                {getMonitorTypeLabel(
                  monitor.type,
                )}{" "}
                · {server.name}
              </Text>
            </View>
            <MonitorStatusBadge
              monitor={monitor}
            />
          </View>

          <View style={styles.currentStatus}>
            <View
              style={[
                styles.currentStatusDot,
                {
                  backgroundColor:
                    status?.color ??
                    colors.textMuted,
                },
              ]}
            />
            <Text style={styles.currentStatusText}>
              Estado actual:{" "}
              <Text
                style={{
                  color:
                    status?.color ??
                    colors.textMuted,
                }}
              >
                {status?.label ?? "Sin datos"}
              </Text>
            </Text>
          </View>

          <Text style={styles.lastCheck}>
            Última comprobación:{" "}
            {formatHeartbeatDate(
              monitor.lastHeartbeatAt,
            )}
          </Text>
          {monitor.message ? (
            <Text style={styles.statusMessage}>
              {monitor.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.metrics}>
          <Metric
            icon="speed"
            label="Respuesta"
            value={
              monitor.ping === null
                ? "—"
                : `${monitor.ping} ms`
            }
            helper={
              averagePing === null
                ? "Último heartbeat"
                : `Media 24 h: ${averagePing} ms`
            }
            color={colors.info}
          />
          <Metric
            icon="percent"
            label="Uptime 24 h"
            value={
              serverStats?.uptime24h != null
                ? formatUptime(
                    serverStats.uptime24h,
                  )
                : uptime === null
                  ? "—"
                  : `${uptime.toFixed(2)} %`
            }
            helper={
              serverStats?.uptime24h != null
                ? "Calculado por Uptime Kuma"
                : "Estimación de la caché local"
            }
            color={colors.success}
          />
          <Metric
            icon="percent"
            label="Uptime 30 días"
            value={formatUptime(
              serverStats?.uptime30d ?? null,
            )}
            helper="Calculado por Uptime Kuma"
            color={colors.success}
          />
          <Metric
            icon="timer-off"
            label="Caído en 24 h"
            value={formatDowntime24h(
              serverStats?.uptime24h ?? null,
            )}
            helper="Derivado del uptime de 24 h"
            color={
              (serverStats?.uptime24h ?? 1) < 1
                ? colors.danger
                : colors.success
            }
          />
          <Metric
            icon="fact-check"
            label="Checks recientes"
            value={heartbeats.length.toLocaleString(
              "es-ES",
            )}
            helper="Máximo 100 guardados por monitor"
            color={colors.primary}
          />
          <Metric
            icon="verified-user"
            label="Certificado SSL"
            value={
              serverStats?.certificateValid ===
              false
                ? "No válido"
                : serverStats
                      ?.certificateDaysRemaining !=
                    null
                  ? `${Math.round(
                      serverStats.certificateDaysRemaining,
                    )} días`
                  : "—"
            }
            helper={
              serverStats
                ?.certificateDaysRemaining != null
                ? "Tiempo restante"
                : "Solo monitores HTTPS"
            }
            color={
              serverStats?.certificateValid ===
              false
                ? colors.danger
                : colors.info
            }
          />
          <Metric
            icon="error-outline"
            label="Incidencias"
            value={String(incidents)}
            helper="Cambios a DOWN guardados"
            color={
              incidents > 0
                ? colors.danger
                : colors.success
            }
          />
        </View>

        {activeIncident ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Incidencia activa
              </Text>
              <Text
                style={styles.sectionDescription}
              >
                Este monitor necesita atención
                ahora mismo
              </Text>
            </View>
            <IncidentCard
              incident={activeIncident}
            />
          </View>
        ) : null}

        <Section
          title="Disponibilidad"
          description="Cada bloque es un tramo de tiempo; se pinta en rojo si hubo alguna caída dentro"
        >
          <MonitorAvailabilityGrid
            samples={availabilitySamples}
          />
        </Section>

        <Section
          title="Timeline"
          description="Cambios de estado más recientes"
        >
          <MonitorTimeline events={events} />
        </Section>

        <Section
          title="Heartbeats"
          description="Últimas comprobaciones recibidas"
        >
          {heartbeats.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no hay heartbeats guardados.
            </Text>
          ) : (
            heartbeats
              .slice(0, 10)
              .map((heartbeat) => {
                const color = getHeartbeatColor(
                  heartbeat.status,
                );

                return (
                  <View
                    key={heartbeat.id}
                    style={styles.heartbeatRow}
                  >
                    <View
                      style={[
                        styles.heartbeatDot,
                        {
                          backgroundColor: color,
                        },
                      ]}
                    />
                    <View
                      style={
                        styles.heartbeatInformation
                      }
                    >
                      <Text
                        style={[
                          styles.heartbeatStatus,
                          { color },
                        ]}
                      >
                        {getHeartbeatLabel(
                          heartbeat.status,
                        )}
                      </Text>
                      <Text
                        style={
                          styles.heartbeatDate
                        }
                      >
                        {new Date(
                          heartbeat.createdAt,
                        ).toLocaleString("es-ES")}
                      </Text>
                    </View>
                    <Text
                      style={styles.heartbeatPing}
                    >
                      {heartbeat.ping === null
                        ? "—"
                        : `${heartbeat.ping} ms`}
                    </Text>
                  </View>
                );
              })
          )}
        </Section>

        <Section
          title="Historial"
          description="Eventos persistidos en este dispositivo"
        >
          <View style={styles.historySummary}>
            <MaterialIcons
              name="history"
              size={28}
              color={colors.primary}
            />
            <View style={styles.historyInformation}>
              <Text style={styles.historyValue}>
                {events.length} evento
                {events.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.historyDescription}>
                Búsqueda y filtros UP, DOWN,
                pendientes y mantenimiento.
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/timeline",
                params: {
                  serverId,
                  monitorId: String(monitorId),
                  monitorName: monitor.name,
                },
              })
            }
            style={({ pressed }) => [
              styles.historyButton,
              pressed
                ? styles.historyButtonPressed
                : null,
            ]}
          >
            <Text style={styles.historyButtonText}>
              Ver historial completo
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  notFoundTitle: {
    ...typography.heading,
    color: colors.text,
  },
  notFoundDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statusCard: {
    gap: spacing.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statusIdentity: {
    flex: 1,
  },
  monitorName: {
    ...typography.heading,
    color: colors.text,
  },
  monitorType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  currentStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  currentStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currentStatusText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  lastCheck: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  metric: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 126,
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
  },
  metricHelper: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.xl,
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
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  heartbeatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heartbeatDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  heartbeatInformation: {
    flex: 1,
  },
  heartbeatStatus: {
    ...typography.caption,
    fontWeight: "800",
  },
  heartbeatDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  heartbeatPing: {
    ...typography.caption,
    color: colors.info,
    fontWeight: "700",
  },
  historySummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  historyInformation: {
    flex: 1,
  },
  historyValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  historyDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  historyButtonPressed: {
    opacity: 0.78,
  },
  historyButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
