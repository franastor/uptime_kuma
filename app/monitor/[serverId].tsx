import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { calculateDashboardSummary } from "@/src/modules/dashboard/utils/calculateDashboardSummary";
import { IncidentCard } from "@/src/modules/incidents/components/IncidentCard";
import { getActiveIncidents } from "@/src/modules/incidents/utils/getActiveIncidents";
import { MonitorCard } from "@/src/modules/monitor/components/MonitorCard";
import {
  MonitorFilters,
  type MonitorFilter,
} from "@/src/modules/monitor/components/MonitorFilters";
import { useMonitorPreferencesStore } from "@/src/modules/monitor/store/monitorPreferences.store";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import {
  collectAvailableTags,
  matchesMonitorQuery,
  matchesSelectedTags,
} from "@/src/modules/monitor/utils/filterMonitors";
import { formatHeartbeatDate } from "@/src/modules/monitor/utils/monitorPresentation";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import {
  canAddFavorite,
  canUseFeature,
  FREE_MONITOR_LIMIT,
  getMonitorLimit,
  limitMonitorsForPlan,
} from "@/src/modules/subscription/utils/feature-access";
import { AppButton } from "@/src/shared/components/AppButton";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { Screen } from "@/src/shared/components/Screen";
import { StatCard } from "@/src/shared/components/StatCard";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import { colors, spacing, typography } from "@/src/shared/theme";

const EMPTY_MONITORS: Monitor[] = [];
const MONITOR_PAGE_SIZE = 20;

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
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    serverId?: string | string[];
    monitorId?: string | string[];
  }>();
  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;
  const focusedMonitorIdRaw = Array.isArray(
    params.monitorId,
  )
    ? params.monitorId[0]
    : params.monitorId;
  const focusedMonitorId = focusedMonitorIdRaw
    ? Number(focusedMonitorIdRaw)
    : null;
  const resolvedFocusedMonitorId =
    focusedMonitorId !== null &&
    Number.isFinite(focusedMonitorId)
      ? focusedMonitorId
      : null;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MonitorFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [highlightedMonitorId, setHighlightedMonitorId] =
    useState<number | null>(null);
  const [operationsExpanded, setOperationsExpanded] =
    useState(true);
  const [showPremiumModal, setShowPremiumModal] =
    useState(false);
  const [premiumModalKind, setPremiumModalKind] = useState<
    "monitors" | "tags" | "dashboard"
  >("dashboard");

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
  const lastUpdatedAt = useMonitorStore((state) =>
    serverId
      ? state.lastUpdatedByServer[serverId] ?? null
      : null,
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
  const canFilterByTags = canUseFeature(
    plan,
    "advanced-filters",
  );

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    if (resolvedFocusedMonitorId === null) {
      return;
    }

    setFilter("all");
    setQuery("");
    setSelectedTags([]);
    setPage(1);
    setHighlightedMonitorId(resolvedFocusedMonitorId);

    const timeoutId = setTimeout(() => {
      setHighlightedMonitorId(null);
    }, 8_000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [resolvedFocusedMonitorId]);

  useEffect(() => {
    setPage(1);
  }, [query, filter, selectedTags]);

  useEffect(() => {
    if (canFilterByTags) {
      return;
    }

    setSelectedTags([]);
  }, [canFilterByTags]);

  const favorites = useMemo(
    () =>
      serverId
        ? favoriteIdsByServer[serverId] ?? []
        : [],
    [favoriteIdsByServer, serverId],
  );

  const allMonitors = monitors;
  const planMonitors = useMemo(() => {
    const limited = limitMonitorsForPlan(
      allMonitors,
      plan,
      favorites,
    );

    if (resolvedFocusedMonitorId === null) {
      return limited;
    }

    const focused = allMonitors.find(
      (monitor) =>
        monitor.id === resolvedFocusedMonitorId,
    );

    if (
      !focused ||
      limited.some(
        (monitor) => monitor.id === focused.id,
      )
    ) {
      return limited;
    }

    const limit = getMonitorLimit(plan) ?? limited.length;

    return [
      focused,
      ...limited
        .filter(
          (monitor) => monitor.id !== focused.id,
        )
        .slice(0, Math.max(0, limit - 1)),
    ];
  }, [
    allMonitors,
    favorites,
    plan,
    resolvedFocusedMonitorId,
  ]);

  const lockedMonitorCount = Math.max(
    0,
    allMonitors.length - planMonitors.length,
  );

  const availableTags = useMemo(
    () => collectAvailableTags(planMonitors),
    [planMonitors],
  );

  const summary = calculateDashboardSummary(planMonitors);
  const activeIncidents = useMemo(
    () => getActiveIncidents(planMonitors),
    [planMonitors],
  );
  const connected =
    server?.connectionStatus === "connected";
  const summaryDescription = connected
    ? "Estado en tiempo real de esta instancia."
    : lastUpdatedAt
      ? `Datos guardados · ${formatHeartbeatDate(
          new Date(lastUpdatedAt).toISOString(),
        ).toLocaleLowerCase("es-ES")}`
      : "Esperando datos de esta instancia.";
  const hasAdvancedDashboard = canUseFeature(
    plan,
    "advanced-dashboard",
  );

  const visibleMonitors = useMemo(() => {
    const filtered = planMonitors.filter(
      (monitor) =>
        matchesMonitorQuery(monitor, query) &&
        matchesFilter(monitor, filter, favorites) &&
        matchesSelectedTags(
          monitor,
          canFilterByTags ? selectedTags : [],
        ),
    );

    if (resolvedFocusedMonitorId === null) {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      if (left.id === resolvedFocusedMonitorId) {
        return -1;
      }

      if (right.id === resolvedFocusedMonitorId) {
        return 1;
      }

      return 0;
    });
  }, [
    canFilterByTags,
    favorites,
    filter,
    planMonitors,
    query,
    resolvedFocusedMonitorId,
    selectedTags,
  ]);

  const pagedMonitors = useMemo(
    () =>
      visibleMonitors.slice(0, page * MONITOR_PAGE_SIZE),
    [page, visibleMonitors],
  );
  const hasMoreMonitors =
    pagedMonitors.length < visibleMonitors.length;

  function openPremiumModal(
    kind: "monitors" | "tags" | "dashboard",
  ) {
    setPremiumModalKind(kind);
    setShowPremiumModal(true);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  async function handleToggleFavorite(monitorId: number): Promise<void> {
    if (!serverId) {
      return;
    }

    const isFavorite = favorites.includes(monitorId);

    if (!isFavorite && !canAddFavorite(plan, favorites.length)) {
      Alert.alert(
        t("monitors.favoritesLimitTitle"),
        t("monitors.favoritesLimitDescription"),
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
        <Stack.Screen options={{ title: t("monitors.title") }} />
        <Screen contentContainerStyle={styles.centeredScreen}>
          <Text style={styles.errorTitle}>
            {t("monitors.serverNotFound")}
          </Text>
          <Text style={styles.errorDescription}>
            {t("monitors.serverNotFoundHint")}
          </Text>
          <AppButton
            title={t("monitors.backToServers")}
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
            <Text style={styles.title}>
              {t("monitors.title")}
            </Text>
            <Text style={styles.serverUrl} numberOfLines={1}>
              {server.url}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Timeline del servidor"
              onPress={() =>
                router.push({
                  pathname: "/timeline",
                  params: {
                    serverId,
                  },
                })
              }
              style={({ pressed }) => [
                styles.timelineButton,
                pressed ? styles.timelineButtonPressed : null,
              ]}
            >
              <MaterialIcons
                name="timeline"
                size={22}
                color={colors.primary}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes del servidor"
              onPress={() =>
                router.push({
                  pathname:
                    "/monitor/[serverId]/settings",
                  params: {
                    serverId,
                  },
                })
              }
              style={({ pressed }) => [
                styles.timelineButton,
                pressed ? styles.timelineButtonPressed : null,
              ]}
            >
              <MaterialIcons
                name="settings"
                size={22}
                color={colors.primary}
              />
            </Pressable>

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
                  {summaryDescription}
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
                helper={
                  lockedMonitorCount > 0
                    ? `${allMonitors.length} en total · Free máx. ${FREE_MONITOR_LIMIT}`
                    : "Total configurados"
                }
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

            <View style={styles.operationsSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  expanded: operationsExpanded,
                }}
                onPress={() =>
                  setOperationsExpanded(
                    (current) => !current,
                  )
                }
                style={({ pressed }) => [
                  styles.operationsHeader,
                  pressed
                    ? styles.operationsHeaderPressed
                    : null,
                ]}
              >
                <View style={styles.dashboardTitleContainer}>
                  <Text style={styles.sectionTitle}>
                    Centro de operaciones
                  </Text>
                  {!operationsExpanded ? (
                    <Text style={styles.sectionDescription}>
                      {activeIncidents.length > 0
                        ? `${activeIncidents.length} incidencia${activeIncidents.length === 1 ? "" : "s"} activa${activeIncidents.length === 1 ? "" : "s"}`
                        : "Sin incidencias activas"}
                    </Text>
                  ) : (
                    <Text style={styles.sectionDescription}>
                      Lo que necesita tu atención ahora mismo.
                    </Text>
                  )}
                </View>

                <View style={styles.operationsHeaderActions}>
                  <View
                    style={[
                      styles.incidentCounter,
                      activeIncidents.length === 0 &&
                        styles.incidentCounterHealthy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.incidentCounterText,
                        activeIncidents.length === 0 &&
                          styles.incidentCounterHealthyText,
                      ]}
                    >
                      {activeIncidents.length}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={
                      operationsExpanded
                        ? "expand-less"
                        : "expand-more"
                    }
                    size={26}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>

              {operationsExpanded ? (
                activeIncidents.length > 0 ? (
                  <View style={styles.incidentList}>
                    {activeIncidents.map((incident) => (
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
                ) : (
                  <View style={styles.healthyCard}>
                    <View style={styles.healthyIcon}>
                      <MaterialIcons
                        name="verified"
                        size={26}
                        color={colors.background}
                      />
                    </View>
                    <View style={styles.healthyInformation}>
                      <Text style={styles.healthyTitle}>
                        Todo funciona correctamente
                      </Text>
                      <Text style={styles.healthyDescription}>
                        No hay monitores caídos ni comprobaciones
                        pendientes.
                      </Text>
                    </View>
                  </View>
                )
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                hasAdvancedDashboard
                  ? "Abrir dashboard avanzado"
                  : "Dashboard avanzado Premium"
              }
              onPress={() => {
                if (!hasAdvancedDashboard) {
                  openPremiumModal("dashboard");
                  return;
                }

                router.push({
                  pathname: "/analytics",
                  params: {
                    serverId,
                  },
                });
              }}
              style={({ pressed }) => [
                styles.premiumCard,
                pressed ? styles.premiumCardPressed : null,
              ]}
            >
              <View style={styles.premiumIcon}>
                <MaterialIcons
                  name={
                    hasAdvancedDashboard
                      ? "insights"
                      : "workspace-premium"
                  }
                  size={24}
                  color={colors.background}
                />
              </View>
              <View style={styles.premiumInformation}>
                <Text style={styles.premiumTitle}>
                  Dashboard avanzado
                </Text>
                <Text style={styles.premiumDescription}>
                  {hasAdvancedDashboard
                    ? "SLA, rankings, heatmap, MTTR/MTBF y analítica de esta instancia."
                    : "Health Score, analítica, rankings, SLA, heatmap e insights — disponible en Premium."}
                </Text>
              </View>
              <MaterialIcons
                name={
                  hasAdvancedDashboard
                    ? "chevron-right"
                    : "lock"
                }
                size={20}
                color={
                  hasAdvancedDashboard
                    ? colors.primary
                    : colors.warning
                }
              />
            </Pressable>

            <View style={styles.listHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {lockedMonitorCount > 0
                    ? "Monitores Free"
                    : "Todos los monitores"}
                </Text>
                <Text style={styles.sectionDescription}>
                  {lockedMonitorCount > 0
                    ? `${visibleMonitors.length} visibles · ${planMonitors.length}/${FREE_MONITOR_LIMIT} Free · ${allMonitors.length} totales`
                    : `${visibleMonitors.length} de ${planMonitors.length} visibles`}
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

            {lockedMonitorCount > 0 ? (
              <Pressable
                accessibilityRole="button"
              onPress={() =>
                openPremiumModal("monitors")
              }
                style={({ pressed }) => [
                  styles.monitorLimitCard,
                  pressed
                    ? styles.premiumCardPressed
                    : null,
                ]}
              >
                <View style={styles.premiumIcon}>
                  <MaterialIcons
                    name="lock"
                    size={22}
                    color={colors.background}
                  />
                </View>
                <View style={styles.premiumInformation}>
                  <Text style={styles.premiumTitle}>
                    {lockedMonitorCount} monitor
                    {lockedMonitorCount === 1
                      ? ""
                      : "es"}{" "}
                    bloqueado
                    {lockedMonitorCount === 1
                      ? ""
                      : "s"}
                  </Text>
                  <Text style={styles.premiumDescription}>
                    Free permite hasta {FREE_MONITOR_LIMIT}{" "}
                    monitores. Premium desbloquea
                    todos los de esta instancia.
                  </Text>
                </View>
                <MaterialIcons
                  name="workspace-premium"
                  size={20}
                  color={colors.warning}
                />
              </Pressable>
            ) : null}

            <MonitorFilters
              query={query}
              filter={filter}
              availableTags={availableTags}
              selectedTags={selectedTags}
              canFilterByTags={canFilterByTags}
              onQueryChange={setQuery}
              onFilterChange={setFilter}
              onToggleTag={toggleTag}
              onClearTags={() => setSelectedTags([])}
              onRequestTagPremium={() =>
                openPremiumModal("tags")
              }
            />

            {visibleMonitors.length > 0 ? (
              <View style={styles.monitorList}>
                <Text style={styles.listMeta}>
                  {t("monitors.showing", {
                    shown: pagedMonitors.length,
                    total: visibleMonitors.length,
                  })}
                  {selectedTags.length > 0
                    ? ` · ${t("monitors.tagsCount", {
                        count: selectedTags.length,
                      })}`
                    : ""}
                </Text>
                {pagedMonitors.map((monitor) => (
                  <MonitorCard
                    key={monitor.id}
                    monitor={monitor}
                    highlighted={
                      highlightedMonitorId ===
                      monitor.id
                    }
                    favorite={favorites.includes(monitor.id)}
                    onToggleFavorite={() =>
                      void handleToggleFavorite(monitor.id)
                    }
                    onPress={() =>
                      router.push({
                        pathname:
                          "/monitor/[serverId]/[monitorId]",
                        params: {
                          serverId,
                          monitorId: String(
                            monitor.id,
                          ),
                        },
                      })
                    }
                  />
                ))}
                {hasMoreMonitors ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPage((current) => current + 1)
                    }
                    style={({ pressed }) => [
                      styles.loadMoreButton,
                      pressed
                        ? styles.loadMoreButtonPressed
                        : null,
                    ]}
                  >
                    <Text style={styles.loadMoreText}>
                      {t("monitors.loadMore", {
                        remaining:
                          visibleMonitors.length -
                          pagedMonitors.length,
                      })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.filteredEmptyCard}>
                <MaterialIcons
                  name="search-off"
                  size={34}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>
                  {t("monitors.noResults")}
                </Text>
                <Text style={styles.emptyDescription}>
                  {t("monitors.noResultsHint")}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </Screen>

      <ConfirmModal
        visible={showPremiumModal}
        title={t("common.premiumFeature")}
        description={
          premiumModalKind === "tags"
            ? t("monitors.tagPremiumDescription")
            : premiumModalKind === "monitors" ||
                (lockedMonitorCount > 0 &&
                  !hasAdvancedDashboard)
              ? lockedMonitorCount > 0 &&
                !hasAdvancedDashboard
                ? t("monitors.lockedDescription", {
                    limit: FREE_MONITOR_LIMIT,
                  })
                : t("monitors.lockedDescription", {
                    limit: FREE_MONITOR_LIMIT,
                  })
              : t("analytics.premiumDescription")
        }
        confirmLabel={t("common.understood")}
        cancelLabel={null}
        onConfirm={() => setShowPremiumModal(false)}
        onCancel={() => setShowPremiumModal(false)}
      />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timelineButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  timelineButtonPressed: {
    opacity: 0.75,
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
  operationsSection: {
    gap: spacing.md,
  },
  operationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  operationsHeaderPressed: {
    opacity: 0.75,
  },
  operationsHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  incidentCounter: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.danger,
  },
  incidentCounterHealthy: {
    backgroundColor: colors.success,
  },
  incidentCounterText: {
    ...typography.bodyMedium,
    color: colors.background,
  },
  incidentCounterHealthyText: {
    color: colors.background,
  },
  incidentList: {
    gap: spacing.sm,
  },
  healthyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  healthyIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.success,
  },
  healthyInformation: {
    flex: 1,
    gap: spacing.xs,
  },
  healthyTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  healthyDescription: {
    ...typography.caption,
    color: colors.textSecondary,
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
  premiumCardPressed: {
    opacity: 0.8,
  },
  monitorLimitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
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
  listMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
  },
  loadMoreButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  loadMoreButtonPressed: {
    opacity: 0.75,
  },
  loadMoreText: {
    ...typography.bodyMedium,
    color: colors.primary,
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
