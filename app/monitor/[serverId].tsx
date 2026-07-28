import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { calculateDashboardSummary } from "@/src/modules/dashboard/utils/calculateDashboardSummary";
import { MonitorCard } from "@/src/modules/monitor/components/MonitorCard";
import {
  MonitorFilters,
  type MonitorFilter,
} from "@/src/modules/monitor/components/MonitorFilters";
import { useMonitorPreferencesStore } from "@/src/modules/monitor/store/monitorPreferences.store";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import {
  canAddFavorite,
  canUseFeature,
} from "@/src/modules/subscription/utils/feature-access";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import { StatCard } from "@/src/shared/components/StatCard";
import { colors, spacing, typography } from "@/src/shared/theme";

const EMPTY_MONITORS: Monitor[] = [];

function matchesQuery(monitor: Monitor, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("es-ES");

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    monitor.name,
    monitor.target ?? "",
    monitor.description ?? "",
    ...monitor.tags.flatMap((tag) => [tag.name, tag.value ?? ""]),
  ];

  return searchableValues.some((value) =>
    value.toLocaleLowerCase("es-ES").includes(normalizedQuery),
  );
}

function matchesFilter(
  monitor: Monitor,
  filter: MonitorFilter,
  favorites: number[],
): boolean {
  switch (filter) {
    case "up":
      return monitor.active && monitor.status === "up";
    case "down":
      return monitor.active && monitor.status === "down";
    case "paused":
      return !monitor.active;
    case "favorites":
      return favorites.includes(monitor.id);
    case "all":
    default:
      return true;
  }
}

export default function MonitorsScreen() {
  const params = useLocalSearchParams<{
    serverId?: string | string[];
  }>();
  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MonitorFilter>("all");

  const server = useServerStore((state) =>
    state.servers.find((item) => item.id === serverId),
  );
  const storedMonitors = useMonitorStore((state) =>
    serverId ? state.monitorsByServer[serverId] : undefined,
  );
  const monitors = storedMonitors ?? EMPTY_MONITORS;
  const loading = useMonitorStore((state) =>
    serverId ? state.loadingByServer[serverId] ?? false : false,
  );
  const error = useMonitorStore((state) =>
    serverId ? state.errorByServer[serverId] ?? null : null,
  );
  const plan = useSubscriptionStore((state) => state.plan);
  const hydratePreferences = useMonitorPreferencesStore(
    (state) => state.hydrate,
  );
  const favoriteIdsByServer = useMonitorPreferencesStore(
    (state) => state.favoriteIdsByServer,
  );
  const toggleFavorite = useMonitorPreferencesStore(
    (state) => state.toggleFavorite,
  );

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const favorites = useMemo(
    () =>
      serverId
        ? favoriteIdsByServer[serverId] ?? []
        : [],
    [favoriteIdsByServer, serverId],
  );
  const summary = calculateDashboardSummary(monitors);
  const hasAdvancedDashboard = canUseFeature(
    plan,
    "advanced-dashboard",
  );

  const visibleMonitors = useMemo(
    () =>
      monitors.filter(
        (monitor) =>
          matchesQuery(monitor, query) &&
          matchesFilter(monitor, filter, favorites),
      ),
    [favorites, filter, monitors, query],
  );

  async function handleToggleFavorite(monitorId: number): Promise<void> {
    if (!serverId) {
      return;
    }

    const isFavorite = favorites.includes(monitorId);

    if (!isFavorite && !canAddFavorite(plan, favorites.length)) {
      Alert.alert(
        "Límite de favoritos",
        "La versión Free permite guardar hasta 3 favoritos por servidor. Premium ofrece favoritos ilimitados.",
      );
      return;
    }

    try {
      await toggleFavorite(serverId, monitorId);
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "No se ha podido actualizar este favorito.",
      );
    }
  }

  if (!serverId || !server) {
    return (
      <>
        <Stack.Screen options={{ title: "Monitores" }} />
        <Screen contentContainerStyle={styles.centeredScreen}>
          <Text style={styles.errorTitle}>Servidor no encontrado</Text>
          <Text style={styles.errorDescription}>
            No se ha podido localizar la instancia seleccionada.
          </Text>
          <AppButton
            title="Volver a servidores"
            onPress={() => router.replace("/")}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: server.name }} />

      <Screen scroll>
        <View style={styles.header}>
          <View style={styles.headerInformation}>
            <Text style={styles.title}>Monitores</Text>
            <Text style={styles.serverUrl} numberOfLines={1}>
              {server.url}
            </Text>
          </View>

          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor:
                    server.connectionStatus === "connected"
                      ? colors.success
                      : colors.warning,
                },
              ]}
            />
            <Text style={styles.connectionText}>
              {server.connectionStatus === "connected"
                ? "En directo"
                : "Datos guardados"}
            </Text>
          </View>
        </View>

        {loading && monitors.length === 0 ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Cargando monitores</Text>
            <Text style={styles.loadingDescription}>
              Esperando la lista enviada por Uptime Kuma...
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              No se pudieron cargar los monitores
            </Text>
            <Text style={styles.errorDescription}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && monitors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay monitores</Text>
            <Text style={styles.emptyDescription}>
              La instancia no ha enviado ningún monitor o todavía estamos
              esperando sus datos.
            </Text>
          </View>
        ) : null}

        {monitors.length > 0 ? (
          <View style={styles.content}>
            <View style={styles.dashboardHeader}>
              <View style={styles.dashboardTitleContainer}>
                <Text style={styles.sectionTitle}>Resumen</Text>
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
                  <MaterialIcons
                    name="workspace-premium"
                    size={24}
                    color={colors.background}
                  />
                </View>
                <View style={styles.premiumInformation}>
                  <Text style={styles.premiumTitle}>Dashboard avanzado</Text>
                  <Text style={styles.premiumDescription}>
                    Premium añadirá históricos, tendencias, disponibilidad y
                    comparativas.
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.listHeader}>
              <View>
                <Text style={styles.sectionTitle}>Todos los monitores</Text>
                <Text style={styles.sectionDescription}>
                  {visibleMonitors.length} de {monitors.length} visibles
                </Text>
              </View>

              <View style={styles.favoriteCounter}>
                <MaterialIcons
                  name="star"
                  size={17}
                  color={colors.warning}
                />
                <Text style={styles.favoriteCounterText}>
                  {favorites.length}
                  {plan === "free" ? "/3" : ""}
                </Text>
              </View>
            </View>

            <MonitorFilters
              query={query}
              filter={filter}
              onQueryChange={setQuery}
              onFilterChange={setFilter}
            />

            {visibleMonitors.length > 0 ? (
              <View style={styles.monitorList}>
                {visibleMonitors.map((monitor) => (
                  <MonitorCard
                    key={monitor.id}
                    monitor={monitor}
                    favorite={favorites.includes(monitor.id)}
                    onToggleFavorite={() =>
                      void handleToggleFavorite(monitor.id)
                    }
                  />
                ))}
              </View>
            ) : (
              <View style={styles.filteredEmptyCard}>
                <MaterialIcons
                  name="search-off"
                  size={34}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptyDescription}>
                  Prueba con otra búsqueda o cambia el filtro seleccionado.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xl,
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
    color: colors.textSecondary,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  loadingCard: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  loadingTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  loadingDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  errorTitle: {
    ...typography.bodyMedium,
    color: colors.danger,
    textAlign: "center",
  },
  errorDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyCard: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: "center",
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
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
  dashboardTitleContainer: {
    flex: 1,
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
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  favoriteCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  favoriteCounterText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "700",
  },
  monitorList: {
    gap: spacing.md,
  },
  filteredEmptyCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
});
