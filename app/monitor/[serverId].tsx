import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { calculateDashboardSummary } from "@/src/modules/dashboard/utils/calculateDashboardSummary";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";

import type {
  Monitor,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";

import { useServerStore } from "@/src/modules/servers/store/server.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";

import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import { StatCard } from "@/src/shared/components/StatCard";

import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

const EMPTY_MONITORS: Monitor[] = [];

function getMonitorStatusInformation(
  monitor: Monitor,
): {
  label: string;
  color: string;
} {
  if (!monitor.active) {
    return {
      label: "Pausado",
      color: colors.textMuted,
    };
  }

  const statusMap: Record<
    MonitorStatus,
    {
      label: string;
      color: string;
    }
  > = {
    up: {
      label: "Operativo",
      color: colors.success,
    },

    down: {
      label: "Caído",
      color: colors.danger,
    },

    pending: {
      label: "Pendiente",
      color: colors.warning,
    },

    maintenance: {
      label: "Mantenimiento",
      color: colors.warning,
    },

    unknown: {
      label: "Esperando estado",
      color: colors.textMuted,
    },
  };

  return statusMap[
    monitor.status
  ];
}

function getMonitorTypeLabel(
  type: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    http: "HTTP",
    keyword:
      "Palabra clave",
    jsonQuery:
      "Consulta JSON",
    port: "Puerto TCP",
    ping: "Ping",
    dns: "DNS",
    push: "Push",
    steam: "Steam",
    docker: "Docker",
    grpcKeyword: "gRPC",
    radius: "RADIUS",
    group: "Grupo",
    mqtt: "MQTT",
    sqlserver:
      "SQL Server",
    postgres:
      "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    redis: "Redis",
    tailscalePing:
      "Tailscale",
  };

  return (
    labels[type] ??
    type.toUpperCase()
  );
}

export default function MonitorsScreen() {
  const params =
    useLocalSearchParams<{
      serverId?:
        | string
        | string[];
    }>();

  const serverId =
    Array.isArray(
      params.serverId,
    )
      ? params.serverId[0]
      : params.serverId;

  const server =
    useServerStore(
      (state) =>
        state.servers.find(
          (item) =>
            item.id ===
            serverId,
        ),
    );

  const storedMonitors =
    useMonitorStore(
      (state) =>
        serverId
          ? state
              .monitorsByServer[
              serverId
            ]
          : undefined,
    );

  const monitors =
    storedMonitors ??
    EMPTY_MONITORS;

  const plan = useSubscriptionStore(
    (state) => state.plan,
  );

  const summary =
    calculateDashboardSummary(monitors);

  const hasAdvancedDashboard =
    canUseFeature(
      plan,
      "advanced-dashboard",
    );

  const loading =
    useMonitorStore(
      (state) =>
        serverId
          ? state
              .loadingByServer[
              serverId
            ] ?? false
          : false,
    );

  const error =
    useMonitorStore(
      (state) =>
        serverId
          ? state
              .errorByServer[
              serverId
            ] ?? null
          : null,
    );

  if (
    !serverId ||
    !server
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              "Monitores",
          }}
        />

        <Screen
          contentContainerStyle={
            styles.centeredScreen
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Servidor no encontrado
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            No se ha podido localizar la instancia seleccionada.
          </Text>

          <AppButton
            title="Volver a servidores"
            onPress={() =>
              router.replace(
                "/",
              )
            }
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title:
            server.name,
        }}
      />

      <Screen scroll>
        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerInformation
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Monitores
            </Text>

            <Text
              style={
                styles.serverUrl
              }
              numberOfLines={
                1
              }
            >
              {server.url}
            </Text>
          </View>

          <View
            style={
              styles.connectionBadge
            }
          >
            <View
              style={
                styles.connectedDot
              }
            />

            <Text
              style={
                styles.connectionText
              }
            >
              Conectado
            </Text>
          </View>
        </View>

        {loading &&
        monitors.length ===
          0 ? (
          <View
            style={
              styles.loadingCard
            }
          >
            <ActivityIndicator
              size="large"
              color={
                colors.primary
              }
            />

            <Text
              style={
                styles.loadingTitle
              }
            >
              Cargando monitores
            </Text>

            <Text
              style={
                styles.loadingDescription
              }
            >
              Esperando la lista enviada por Uptime Kuma...
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              No se pudieron cargar los monitores
            </Text>

            <Text
              style={
                styles.errorDescription
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        {!loading &&
        !error &&
        monitors.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              No hay monitores
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              La instancia no ha enviado ningún monitor o todavía estamos esperando sus datos.
            </Text>
          </View>
        ) : null}

        {monitors.length >
        0 ? (
          <View
            style={
              styles.content
            }
          >
            <View style={styles.dashboardHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Resumen
                </Text>

                <Text style={styles.sectionDescription}>
                  Estado en tiempo real de esta instancia.
                </Text>
              </View>

              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>
                  {plan === "premium" ? "PREMIUM" : "FREE"}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="Monitores"
                value={summary.total}
                icon="monitor"
                helper="Total configurados"
              />

              <StatCard
                label="Operativos"
                value={summary.up}
                icon="check-circle-outline"
                accentColor={colors.success}
                helper="Funcionando ahora"
              />

              <StatCard
                label="Incidencias"
                value={summary.activeIncidents}
                icon="error-outline"
                accentColor={
                  summary.activeIncidents > 0
                    ? colors.danger
                    : colors.success
                }
                helper={
                  summary.activeIncidents > 0
                    ? `${summary.down} caídos · ${summary.pending} pendientes`
                    : "Sin incidencias activas"
                }
              />

              <StatCard
                label="Ping medio"
                value={
                  summary.averagePing === null
                    ? "—"
                    : `${summary.averagePing} ms`
                }
                icon="speed"
                accentColor={colors.info}
                helper={`${summary.paused} pausados · ${summary.unknown} sin datos`}
              />
            </View>

            {!hasAdvancedDashboard ? (
              <View style={styles.premiumCard}>
                <View style={styles.premiumIcon}>
                  <Text style={styles.premiumIconText}>★</Text>
                </View>

                <View style={styles.premiumInformation}>
                  <Text style={styles.premiumTitle}>
                    Dashboard avanzado
                  </Text>

                  <Text style={styles.premiumDescription}>
                    La versión Premium añadirá históricos, tendencias, disponibilidad y comparativas.
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              style={
                styles.monitorList
              }
            >
              {monitors.map(
                (monitor) => {
                  const status =
                    getMonitorStatusInformation(
                      monitor,
                    );

                  return (
                    <Pressable
                      key={
                        monitor.id
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.monitorCard,

                        pressed &&
                          styles.monitorCardPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusBar,
                          {
                            backgroundColor:
                              status.color,
                          },
                        ]}
                      />

                      <View
                        style={
                          styles.monitorInformation
                        }
                      >
                        <View
                          style={
                            styles.monitorHeader
                          }
                        >
                          <Text
                            style={
                              styles.monitorName
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              monitor.name
                            }
                          </Text>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                borderColor:
                                  status.color,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor:
                                    status.color,
                                },
                              ]}
                            />

                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    status.color,
                                },
                              ]}
                            >
                              {
                                status.label
                              }
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={
                            styles.monitorType
                          }
                        >
                          {getMonitorTypeLabel(
                            monitor.type,
                          )}
                        </Text>

                        {monitor.target ? (
                          <Text
                            style={
                              styles.monitorTarget
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              monitor.target
                            }
                          </Text>
                        ) : null}

                        <View
                          style={
                            styles.monitorMetadata
                          }
                        >
                          {monitor.interval ? (
                            <Text
                              style={
                                styles.metadataText
                              }
                            >
                              Cada{" "}
                              {
                                monitor.interval
                              }{" "}
                              s
                            </Text>
                          ) : null}

                          {monitor.ping !==
                          null ? (
                            <Text
                              style={
                                styles.metadataText
                              }
                            >
                              {
                                monitor.ping
                              }{" "}
                              ms
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles =
  StyleSheet.create({
    centeredScreen: {
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.lg,
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      marginBottom:
        spacing.xl,
    },

    headerInformation: {
      flex: 1,
      gap: spacing.xs,
    },

    title: {
      ...typography.heading,
      color: colors.text,
    },

    serverUrl: {
      ...typography.caption,
      color:
        colors.textSecondary,
    },

    connectionBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.xs,
      paddingHorizontal:
        spacing.sm,
      paddingVertical:
        spacing.xs,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 20,
      backgroundColor:
        colors.surface,
    },

    connectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        colors.success,
    },

    connectionText: {
      ...typography.caption,
      color:
        colors.success,
      fontWeight: "600",
    },

    loadingCard: {
      alignItems:
        "center",
      gap: spacing.md,
      padding:
        spacing.xxl,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 20,
      backgroundColor:
        colors.surface,
    },

    loadingTitle: {
      ...typography.bodyMedium,
      color: colors.text,
    },

    loadingDescription: {
      ...typography.body,
      color:
        colors.textSecondary,
      textAlign:
        "center",
    },

    errorCard: {
      gap: spacing.sm,
      padding:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        colors.danger,
      borderRadius: 18,
      backgroundColor:
        colors.surface,
    },

    errorTitle: {
      ...typography.bodyMedium,
      color:
        colors.danger,
      textAlign:
        "center",
    },

    errorDescription: {
      ...typography.body,
      color:
        colors.textSecondary,
      textAlign:
        "center",
    },

    emptyCard: {
      gap: spacing.sm,
      padding:
        spacing.xl,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      backgroundColor:
        colors.surface,
    },

    emptyTitle: {
      ...typography.bodyMedium,
      color: colors.text,
      textAlign:
        "center",
    },

    emptyDescription: {
      ...typography.body,
      color:
        colors.textSecondary,
      textAlign:
        "center",
    },

    content: {
      gap: spacing.lg,
    },

    dashboardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },

    sectionTitle: {
      ...typography.heading,
      color: colors.text,
    },

    sectionDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    planBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      backgroundColor: colors.surfaceElevated,
    },

    planBadgeText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "800",
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },

    premiumCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 18,
      backgroundColor: colors.surfaceElevated,
    },

    premiumIcon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: colors.primary,
    },

    premiumIconText: {
      fontSize: 20,
      color: colors.background,
      fontWeight: "800",
    },

    premiumInformation: {
      flex: 1,
      gap: spacing.xs,
    },

    premiumTitle: {
      ...typography.bodyMedium,
      color: colors.text,
    },

    premiumDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    monitorList: {
      gap: spacing.md,
    },

    monitorCard: {
      flexDirection:
        "row",
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      backgroundColor:
        colors.surface,
    },

    monitorCardPressed: {
      opacity: 0.8,
    },

    statusBar: {
      width: 5,
    },

    monitorInformation: {
      flex: 1,
      gap: spacing.xs,
      padding:
        spacing.lg,
    },

    monitorHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: spacing.sm,
    },

    monitorName: {
      ...typography.bodyMedium,
      flex: 1,
      color: colors.text,
    },

    monitorType: {
      ...typography.caption,
      color:
        colors.primary,
      fontWeight: "600",
    },

    monitorTarget: {
      ...typography.caption,
      color:
        colors.textSecondary,
    },

    statusBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.xs,
      paddingHorizontal:
        spacing.sm,
      paddingVertical:
        spacing.xs,
      borderWidth: 1,
      borderRadius: 20,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    statusText: {
      ...typography.caption,
      fontWeight: "600",
    },

    monitorMetadata: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: spacing.md,
      marginTop:
        spacing.xs,
    },

    metadataText: {
      ...typography.caption,
      color:
        colors.textMuted,
    },
  });