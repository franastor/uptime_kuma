import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { kumaService } from "@/src/core/services/KumaService";
import {
  KumaAuthenticationError,
  KumaTwoFactorRequiredError,
} from "@/src/core/socket/kumaSocket.types";

import { useServerStore } from "@/src/modules/servers/store/server.store";

import type {
  KumaServer,
  ServerConnectionStatus,
} from "@/src/modules/servers/types/server";

import { AppButton } from "@/src/shared/components/AppButton";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { Screen } from "@/src/shared/components/Screen";
import { TwoFactorModal } from "@/src/shared/components/TwoFactorModal";

import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type StatusInformation = {
  label: string;
  color: string;
  animated: boolean;
};

function getStatusInformation(
  status: ServerConnectionStatus,
): StatusInformation {
  switch (status) {
    case "connecting":
      return {
        label: "Conectando...",
        color: colors.warning,
        animated: true,
      };

    case "reconnecting":
      return {
        label: "Reconectando...",
        color: colors.warning,
        animated: true,
      };

    case "connected":
      return {
        label: "Conectado",
        color: colors.success,
        animated: false,
      };

    case "offline":
      return {
        label: "Servidor inaccesible",
        color: colors.danger,
        animated: false,
      };

    case "auth-error":
      return {
        label: "Revisa las credenciales",
        color: colors.danger,
        animated: false,
      };

    case "never":
    default:
      return {
        label: "Nunca conectado",
        color: colors.textMuted,
        animated: false,
      };
  }
}

function formatRelativeDate(
  value: string | null,
  now: number,
): string | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(
    value,
  ).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (now - timestamp) / 1_000,
    ),
  );

  if (elapsedSeconds < 10) {
    return "Sincronizado ahora";
  }

  if (elapsedSeconds < 60) {
    return `Sincronizado hace ${elapsedSeconds} s`;
  }

  const elapsedMinutes = Math.floor(
    elapsedSeconds / 60,
  );

  if (elapsedMinutes < 60) {
    return `Sincronizado hace ${elapsedMinutes} ${
      elapsedMinutes === 1
        ? "minuto"
        : "minutos"
    }`;
  }

  const elapsedHours = Math.floor(
    elapsedMinutes / 60,
  );

  if (elapsedHours < 24) {
    return `Sincronizado hace ${elapsedHours} ${
      elapsedHours === 1
        ? "hora"
        : "horas"
    }`;
  }

  const elapsedDays = Math.floor(
    elapsedHours / 24,
  );

  return `Sincronizado hace ${elapsedDays} ${
    elapsedDays === 1
      ? "día"
      : "días"
  }`;
}

function shouldShowConnectionError(
  status: ServerConnectionStatus,
): boolean {
  return (
    status === "offline" ||
    status === "auth-error"
  );
}

export default function ServersScreen() {
  const [
    currentTime,
    setCurrentTime,
  ] = useState(Date.now());

  const [
    deletingServerId,
    setDeletingServerId,
  ] = useState<string | null>(
    null,
  );

  const [
    serverPendingDeletion,
    setServerPendingDeletion,
  ] = useState<KumaServer | null>(
    null,
  );

  const [
    serverPendingTwoFactor,
    setServerPendingTwoFactor,
  ] = useState<KumaServer | null>(
    null,
  );

  const [
    twoFactorLoading,
    setTwoFactorLoading,
  ] = useState(false);

  const [
    twoFactorError,
    setTwoFactorError,
  ] = useState<string | null>(
    null,
  );

  const servers = useServerStore(
    (state) => state.servers,
  );

  const activeServerId =
    useServerStore(
      (state) =>
        state.activeServerId,
    );

  const hydrated = useServerStore(
    (state) => state.hydrated,
  );

  const hydrate = useServerStore(
    (state) => state.hydrate,
  );

  const setActiveServer =
    useServerStore(
      (state) =>
        state.setActiveServer,
    );

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
      return;
    }

    // Auto-conexión al arrancar: si hay servidor activo y no está
    // conectado ni conectando, conectar solo (sin navegar, sin modales).
    // Si requiere 2FA o credenciales, falla en silencio y el usuario
    // pulsa el servidor como siempre.
    //
    // IMPORTANTE: leemos el estado con getState() y NO dependemos de
    // `servers` como dependencia del efecto. connect() actualiza el
    // array de servidores (connectionStatus) y si el efecto dependiera
    // de esa referencia, entraría en un bucle infinito de reconexión
    // que satura la app y la hace crashear.
    if (activeServerId) {
      const server = useServerStore
        .getState()
        .servers.find(
          (item) => item.id === activeServerId,
        );

      const isBusy =
        server?.connectionStatus ===
          "connecting" ||
        server?.connectionStatus ===
          "reconnecting" ||
        server?.connectionStatus ===
          "connected" ||
        kumaService.isConnected(
          server?.id ?? "",
        );

      if (server && !isBusy) {
        void kumaService
          .connect(server.id)
          .catch(() => {
            // Silencioso: el estado de conexión lo gestiona KumaService.
          });
      }
    }
  }, [
    hydrate,
    hydrated,
    activeServerId,
  ]);

  useEffect(() => {
    const intervalId =
      setInterval(
        () => {
          setCurrentTime(
            Date.now(),
          );
        },
        15_000,
      );

    return () => {
      clearInterval(
        intervalId,
      );
    };
  }, []);

  function openMonitorScreen(
    serverId: string,
  ): void {
    router.push({
      pathname:
        "/monitor/[serverId]",
      params: {
        serverId,
      },
    });
  }

  function openTwoFactorModal(
    server: KumaServer,
  ): void {
    setTwoFactorError(
      null,
    );

    setServerPendingTwoFactor(
      server,
    );
  }

  function closeTwoFactorModal(): void {
    if (twoFactorLoading) {
      return;
    }

    setServerPendingTwoFactor(
      null,
    );

    setTwoFactorError(
      null,
    );
  }

  async function connectWithoutTwoFactor(
    server: KumaServer,
  ): Promise<void> {
    await setActiveServer(
      server.id,
    );

    if (
      !kumaService.isConnected(
        server.id,
      )
    ) {
      await kumaService.connect(
        server.id,
      );
    }

    openMonitorScreen(
      server.id,
    );
  }

  async function handleServerPress(
    server: KumaServer,
  ): Promise<void> {
    if (
      deletingServerId !== null ||
      twoFactorLoading
    ) {
      return;
    }

    try {
      await connectWithoutTwoFactor(
        server,
      );
    } catch (error) {
      if (
        error instanceof
        KumaTwoFactorRequiredError
      ) {
        openTwoFactorModal(
          server,
        );

        return;
      }

      if (
        error instanceof
        KumaAuthenticationError
      ) {
        Alert.alert(
          "Error de autenticación",
          error.message,
        );

        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.";

      Alert.alert(
        "Error de conexión",
        message,
      );
    }
  }

  async function handleTwoFactorConfirm(
    token: string,
  ): Promise<void> {
    const server =
      serverPendingTwoFactor;

    if (
      !server ||
      twoFactorLoading
    ) {
      return;
    }

    setTwoFactorLoading(
      true,
    );

    setTwoFactorError(
      null,
    );

    try {
      await setActiveServer(
        server.id,
      );

      await kumaService.connect(
        server.id,
        {
          twoFactorToken:
            token,
        },
      );

      setServerPendingTwoFactor(
        null,
      );

      openMonitorScreen(
        server.id,
      );
    } catch (error) {
      if (
        error instanceof
        KumaTwoFactorRequiredError
      ) {
        setTwoFactorError(
          "El código no es válido o ha caducado.",
        );

        return;
      }

      if (
        error instanceof
        KumaAuthenticationError
      ) {
        setTwoFactorError(
          error.message ||
            "El código no es válido o ha caducado.",
        );

        return;
      }

      setTwoFactorError(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setTwoFactorLoading(
        false,
      );
    }
  }

  function handleEditServer(
    serverId: string,
  ): void {
    if (
      deletingServerId !== null ||
      twoFactorLoading
    ) {
      return;
    }

    router.push({
      pathname: "/login",
      params: {
        serverId,
      },
    });
  }

  function requestServerDeletion(
    server: KumaServer,
  ): void {
    if (
      deletingServerId !== null ||
      twoFactorLoading
    ) {
      return;
    }

    setServerPendingDeletion(
      server,
    );
  }

  function cancelServerDeletion(): void {
    if (
      deletingServerId !== null
    ) {
      return;
    }

    setServerPendingDeletion(
      null,
    );
  }

  async function deleteServer(
    serverId: string,
  ): Promise<void> {
    if (
      deletingServerId !== null
    ) {
      return;
    }

    setDeletingServerId(
      serverId,
    );

    try {
      kumaService.disconnect(
        serverId,
      );

      await useServerStore
        .getState()
        .deleteServer(
          serverId,
        );

      setServerPendingDeletion(
        null,
      );
    } catch (error) {
      console.error(
        "Error deleting server:",
        error,
      );

      Alert.alert(
        "No se pudo eliminar",
        error instanceof Error
          ? error.message
          : "Se ha producido un error al eliminar el servidor.",
      );
    } finally {
      setDeletingServerId(
        null,
      );
    }
  }

  if (!hydrated) {
    return (
      <Screen
        contentContainerStyle={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </Screen>
    );
  }

  return (
    <>
      <Screen scroll>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text
              style={
                styles.logoText
              }
            >
              K
            </Text>
          </View>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Tus servidores
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Selecciona una instancia
              de Uptime Kuma.
            </Text>

            <Text
              style={styles.versionText}
            >
              Versión{" "}
              {Constants.expoConfig
                ?.version ??
                "?"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            onPress={() =>
              router.push("/settings")
            }
            style={({ pressed }) => [
              styles.settingsButton,
              pressed
                ? styles.settingsButtonPressed
                : null,
            ]}
          >
            <MaterialIcons
              name="settings"
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {servers.length === 0 ? (
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
              No hay servidores
              configurados
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Añade tu primera instancia
              para comenzar a consultar
              los monitores.
            </Text>

            <AppButton
              title="Añadir servidor"
              onPress={() =>
                router.push("/login")
              }
            />
          </View>
        ) : (
          <View
            style={
              styles.content
            }
          >
            <View
              style={
                styles.serverList
              }
            >
              {servers.map(
                (server) => {
                  const isActive =
                    server.id ===
                    activeServerId;

                  const statusInformation =
                    getStatusInformation(
                      server.connectionStatus,
                    );

                  const isConnecting =
                    server.connectionStatus ===
                    "connecting";

                  const isReconnecting =
                    server.connectionStatus ===
                    "reconnecting";

                  const isDeleting =
                    deletingServerId ===
                    server.id;

                  const isBusy =
                    isConnecting ||
                    isReconnecting;

                  const actionsDisabled =
                    deletingServerId !==
                      null ||
                    twoFactorLoading;

                  const lastSyncLabel =
                    formatRelativeDate(
                      server.lastSyncAt,
                      currentTime,
                    );

                  const showError =
                    Boolean(
                      server.lastConnectionError,
                    ) &&
                    shouldShowConnectionError(
                      server.connectionStatus,
                    );

                  return (
                    <View
                      key={server.id}
                      style={[
                        styles.serverCard,

                        isActive &&
                          styles.activeServerCard,

                        isDeleting &&
                          styles.disabledCard,
                      ]}
                    >
                      <Pressable
                        disabled={
                          isConnecting ||
                          isDeleting ||
                          twoFactorLoading
                        }
                        onPress={() =>
                          void handleServerPress(
                            server,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.serverMainButton,

                          pressed &&
                            styles.pressedCard,
                        ]}
                      >
                        <View
                          style={
                            styles.serverStatus
                          }
                        >
                          {statusInformation.animated ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                statusInformation.color
                              }
                            />
                          ) : (
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor:
                                    statusInformation.color,
                                },
                              ]}
                            />
                          )}
                        </View>

                        <View
                          style={
                            styles.serverInformation
                          }
                        >
                          <View
                            style={
                              styles.serverTitleRow
                            }
                          >
                            <Text
                              style={
                                styles.serverName
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {server.name}
                            </Text>

                            {isActive ? (
                              <Text
                                style={
                                  styles.activeBadge
                                }
                              >
                                Seleccionado
                              </Text>
                            ) : null}
                          </View>

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

                          <Text
                            style={
                              styles.serverUsername
                            }
                          >
                            Usuario:{" "}
                            {
                              server.username
                            }
                          </Text>

                          {server.hasTwoFactor ? (
                            <View
                              style={
                                styles.twoFactorRow
                              }
                            >
                              <MaterialIcons
                                name="verified-user"
                                size={14}
                                color={
                                  colors.primary
                                }
                              />

                              <Text
                                style={
                                  styles.twoFactorText
                                }
                              >
                                2FA activado
                              </Text>
                            </View>
                          ) : null}

                          <View
                            style={
                              styles.connectionRow
                            }
                          >
                            <Text
                              style={[
                                styles.connectionStatus,
                                {
                                  color:
                                    statusInformation.color,
                                },
                              ]}
                            >
                              {
                                statusInformation.label
                              }
                            </Text>

                            {isReconnecting &&
                            lastSyncLabel ? (
                              <Text
                                style={
                                  styles.cachedBadge
                                }
                              >
                                Datos guardados
                              </Text>
                            ) : null}
                          </View>

                          {lastSyncLabel ? (
                            <Text
                              style={
                                styles.lastSyncText
                              }
                            >
                              {
                                lastSyncLabel
                              }
                            </Text>
                          ) : null}

                          {isBusy &&
                          server.lastSyncAt ? (
                            <Text
                              style={
                                styles.connectionHint
                              }
                            >
                              Puedes seguir
                              consultando los
                              últimos datos
                              recibidos.
                            </Text>
                          ) : null}

                          {showError ? (
                            <Text
                              style={
                                styles.errorMessage
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {
                                server.lastConnectionError
                              }
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>

                      <View
                        style={
                          styles.serverActions
                        }
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Editar conexión ${server.name}`}
                          disabled={
                            actionsDisabled
                          }
                          hitSlop={6}
                          onPress={() =>
                            handleEditServer(
                              server.id,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.actionButton,

                            pressed &&
                              styles.actionButtonPressed,

                            actionsDisabled &&
                              styles.actionButtonDisabled,
                          ]}
                        >
                          <MaterialIcons
                            name="edit"
                            size={22}
                            color={
                              colors.primary
                            }
                          />
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar servidor ${server.name}`}
                          disabled={
                            actionsDisabled
                          }
                          hitSlop={6}
                          onPress={() =>
                            requestServerDeletion(
                              server,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.actionButton,
                            styles.deleteActionButton,

                            pressed &&
                              styles.actionButtonPressed,

                            actionsDisabled &&
                              styles.actionButtonDisabled,
                          ]}
                        >
                          {isDeleting ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                colors.danger
                              }
                            />
                          ) : (
                            <MaterialIcons
                              name="delete-outline"
                              size={24}
                              color={
                                colors.danger
                              }
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                },
              )}
            </View>

            <AppButton
              title="Añadir otro servidor"
              onPress={() =>
                router.push("/login")
              }
            />
          </View>
        )}
      </Screen>

      <ConfirmModal
        visible={
          serverPendingDeletion !==
          null
        }
        title="Eliminar servidor"
        description={
          serverPendingDeletion
            ? `¿Seguro que quieres eliminar "${serverPendingDeletion.name}"?\n\nSolo se eliminará de esta aplicación. La instancia de Uptime Kuma y sus monitores no se modificarán.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        loading={
          deletingServerId !== null
        }
        onCancel={
          cancelServerDeletion
        }
        onConfirm={() => {
          if (
            serverPendingDeletion
          ) {
            void deleteServer(
              serverPendingDeletion.id,
            );
          }
        }}
      />

      <TwoFactorModal
        visible={
          serverPendingTwoFactor !==
          null
        }
        serverName={
          serverPendingTwoFactor?.name
        }
        loading={
          twoFactorLoading
        }
        error={
          twoFactorError
        }
        onCancel={
          closeTwoFactorModal
        }
        onConfirm={
          handleTwoFactorConfirm
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },

  logo: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor:
      colors.primary,
  },

  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.background,
  },

  headerText: {
    flex: 1,
    gap: spacing.xs,
  },

  settingsButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  settingsButtonPressed: {
    opacity: 0.75,
  },

  title: {
    ...typography.heading,
    color: colors.text,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
  },

  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  content: {
    gap: spacing.xl,
  },

  serverList: {
    gap: spacing.md,
  },

  serverCard: {
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor:
      colors.surface,
  },

  activeServerCard: {
    borderColor: colors.primary,
    backgroundColor:
      colors.surfaceElevated,
  },

  serverMainButton: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },

  pressedCard: {
    opacity: 0.8,
  },

  disabledCard: {
    opacity: 0.7,
  },

  serverStatus: {
    width: 20,
    alignItems: "center",
    paddingTop: spacing.xs,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  serverInformation: {
    flex: 1,
    gap: spacing.xs,
  },

  serverTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: spacing.sm,
  },

  serverName: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.text,
  },

  serverUrl: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  serverUsername: {
    ...typography.caption,
    color: colors.textMuted,
  },

  twoFactorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  twoFactorText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },

  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  connectionStatus: {
    ...typography.caption,
    fontWeight: "600",
  },

  lastSyncText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  connectionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },

  cachedBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: "hidden",
    color: colors.textSecondary,
    backgroundColor: colors.border,
  },

  errorMessage: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.danger,
  },

  activeBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    overflow: "hidden",
    color: colors.primary,
    backgroundColor: colors.border,
  },

  serverActions: {
    width: 58,
    borderLeftWidth: 1,
    borderLeftColor:
      colors.border,
  },

  actionButton: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteActionButton: {
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  actionButtonPressed: {
    opacity: 0.55,
    backgroundColor:
      colors.surfaceElevated,
  },

  actionButtonDisabled: {
    opacity: 0.5,
  },

  emptyCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor:
      colors.surface,
  },

  emptyTitle: {
    ...typography.heading,
    color: colors.text,
  },

  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
