import { KumaSocket } from "@/src/core/socket/KumaSocket";

import {
  KumaAuthenticationError,
  KumaConnectionError,
  KumaTwoFactorRequiredError,
} from "@/src/core/socket/kumaSocket.types";

import { getServerCredentials } from "@/src/core/storage/serverStorage";

import { useServerStore } from "@/src/modules/servers/store/server.store";

import type {
  ServerConnectionStatus,
} from "@/src/modules/servers/types/server";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";

import type {
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";

import { normalizeMonitor } from "@/src/modules/monitor/utils/normalizeMonitor";

import { notificationManager } from "@/src/notifications";

export type ConnectToKumaOptions = {
  twoFactorToken?: string;
};

export type KumaConnectionResult = {
  authenticated: true;
  sessionToken?: string;
};

function normalizeHeartbeatStatus(
  status: number,
): MonitorStatus {
  switch (status) {
    case 0:
      return "down";

    case 1:
      return "up";

    case 2:
      return "pending";

    case 3:
      return "maintenance";

    default:
      return "unknown";
  }
}

function normalizeDeletedMonitorId(
  payload: unknown,
): number | null {
  if (
    typeof payload === "number" &&
    Number.isFinite(payload)
  ) {
    return payload;
  }

  if (typeof payload === "string") {
    const monitorId = Number(payload);

    return Number.isFinite(monitorId)
      ? monitorId
      : null;
  }

  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return null;
  }

  const candidate = payload as {
    id?: unknown;
    monitorID?: unknown;
    monitorId?: unknown;
  };

  const rawMonitorId =
    candidate.id ??
    candidate.monitorID ??
    candidate.monitorId;

  const monitorId = Number(
    rawMonitorId,
  );

  return Number.isFinite(monitorId)
    ? monitorId
    : null;
}

class KumaService {
  private readonly connections = new Map<
    string,
    KumaSocket
  >();

  async connect(
    serverId: string,
    options: ConnectToKumaOptions = {},
  ): Promise<KumaConnectionResult> {
    const server = useServerStore
      .getState()
      .servers.find(
        (item) => item.id === serverId,
      );

    if (!server) {
      throw new KumaConnectionError(
        "No se ha encontrado el servidor seleccionado.",
      );
    }

    const credentials =
      await getServerCredentials(serverId);

    if (!credentials) {
      await this.updateConnectionStatus(
        serverId,
        "auth-error",
        "No se encontraron las credenciales.",
      );

      throw new KumaAuthenticationError(
        "No se encontraron las credenciales guardadas.",
      );
    }

    await this.updateConnectionStatus(
      serverId,
      "connecting",
    );

    useMonitorStore
      .getState()
      .setLoading(serverId, true);

    useMonitorStore
      .getState()
      .setError(serverId, null);

    this.disconnect(serverId);

    const socket = new KumaSocket();

    this.connections.set(
      serverId,
      socket,
    );

    socket.setMonitorListListener(
      (monitorList) => {
        const monitors = Object
          .values(monitorList)
          .map(normalizeMonitor);

        useMonitorStore
          .getState()
          .setMonitors(
            serverId,
            monitors,
          );

        void this.updateLastSyncAt(
          serverId,
        );
      },
    );

    socket.setMonitorUpdateListener(
      (monitorList) => {
        const monitors = Object
          .values(monitorList)
          .map(normalizeMonitor);

        const monitorStore =
          useMonitorStore.getState();

        for (
          const monitor
          of monitors
        ) {
          monitorStore.updateMonitor(
            serverId,
            monitor,
          );
        }

        void this.updateLastSyncAt(
          serverId,
        );
      },
    );

    socket.setMonitorDeleteListener(
      (payload) => {
        const monitorId =
          normalizeDeletedMonitorId(
            payload,
          );

        if (monitorId === null) {
          console.warn(
            "No se pudo identificar el monitor eliminado:",
            payload,
          );

          return;
        }

        useMonitorStore
          .getState()
          .removeMonitor(
            serverId,
            monitorId,
          );

        void this.updateLastSyncAt(
          serverId,
        );
      },
    );

    socket.setHeartbeatListener(
      (heartbeat) => {
        useMonitorStore
          .getState()
          .updateHeartbeat(
            serverId,
            {
              monitorId:
                heartbeat.monitorID,

              status:
                normalizeHeartbeatStatus(
                  heartbeat.status,
                ),

              ping:
                heartbeat.ping,

              message:
                heartbeat.msg,

              heartbeatAt:
                heartbeat.time,

              retries:
                heartbeat.retries,

              important:
                heartbeat.important,
            },
          );

        const monitor = useMonitorStore
          .getState()
          .monitorsByServer[serverId]
          ?.find(
            (item) =>
              item.id ===
              heartbeat.monitorID,
          );

        if (!monitor) {
          return;
        }

        void notificationManager.handleStatusChange(
          {
            serverId,
            monitor,
            heartbeatAt:
              heartbeat.time,
            important:
              heartbeat.important,
          },
        );
      },
    );

    socket.setDisconnectListener(
      (reason) => {
        if (
          reason ===
          "io client disconnect"
        ) {
          return;
        }

        void this.updateConnectionStatus(
          serverId,
          "reconnecting",
          null,
        );
      },
    );

    socket.setReconnectAttemptListener(
      () => {
        void this.updateConnectionStatus(
          serverId,
          "reconnecting",
          null,
        );
      },
    );

    socket.setReconnectListener(
      () => {
        void this.updateConnectionStatus(
          serverId,
          "connected",
          null,
        );

        useMonitorStore
          .getState()
          .setError(
            serverId,
            null,
          );
      },
    );

    socket.setReconnectErrorListener(
      (error) => {
        void this.updateConnectionStatus(
          serverId,
          "reconnecting",
          error.message,
        );
      },
    );

    socket.setReconnectFailedListener(
      () => {
        const message =
          "No se ha podido restablecer la conexión con el servidor.";

        void this.updateConnectionStatus(
          serverId,
          "offline",
          message,
        );

        useMonitorStore
          .getState()
          .setLoading(
            serverId,
            false,
          );

        useMonitorStore
          .getState()
          .setError(
            serverId,
            message,
          );
      },
    );

    socket.setConnectionErrorListener(
      (error) => {
        const currentStatus =
          this.getConnectionStatus(
            serverId,
          );

        if (
          currentStatus ===
          "reconnecting"
        ) {
          return;
        }

        void this.updateConnectionStatus(
          serverId,
          "offline",
          error.message,
        );
      },
    );

    try {
      await socket.connect({
        url: server.url,
      });

      const loginResponse =
        await socket.login({
          username: server.username,

          password:
            credentials.password,

          token:
            options.twoFactorToken,
        });

      await this.updateConnectionStatus(
        serverId,
        "connected",
      );

      return {
        authenticated: true,

        sessionToken:
          loginResponse.token,
      };
    } catch (error) {
      useMonitorStore
        .getState()
        .setLoading(
          serverId,
          false,
        );

      if (
        error instanceof
          KumaTwoFactorRequiredError ||
        error instanceof
          KumaAuthenticationError
      ) {
        await this.updateConnectionStatus(
          serverId,
          "auth-error",
          error.message,
        );

        useMonitorStore
          .getState()
          .setError(
            serverId,
            error.message,
          );

        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.";

      await this.updateConnectionStatus(
        serverId,
        "offline",
        message,
      );

      useMonitorStore
        .getState()
        .setError(
          serverId,
          message,
        );

      this.disconnect(serverId);

      throw error;
    }
  }

  disconnect(
    serverId: string,
  ): void {
    const socket =
      this.connections.get(
        serverId,
      );

    if (!socket) {
      return;
    }

    socket.disconnect();

    this.connections.delete(
      serverId,
    );
  }

  disconnectAll(): void {
    for (
      const socket
      of this.connections.values()
    ) {
      socket.disconnect();
    }

    this.connections.clear();
  }

  isConnected(
    serverId: string,
  ): boolean {
    return (
      this.connections
        .get(serverId)
        ?.connected ?? false
    );
  }

  private getConnectionStatus(
    serverId: string,
  ): ServerConnectionStatus {
    return (
      useServerStore
        .getState()
        .servers.find(
          (server) =>
            server.id === serverId,
        )
        ?.connectionStatus ??
      "never"
    );
  }

  private async updateConnectionStatus(
    serverId: string,
    status: ServerConnectionStatus,
    error: string | null = null,
  ): Promise<void> {
    await useServerStore
      .getState()
      .updateConnectionStatus({
        serverId,
        status,
        error,
      });
  }

  private async updateLastSyncAt(
    serverId: string,
  ): Promise<void> {
    const store =
      useServerStore.getState();

    if (
      typeof store.updateLastSyncAt !==
      "function"
    ) {
      return;
    }

    await store.updateLastSyncAt({
      serverId,
      syncedAt:
        new Date().toISOString(),
    });
  }
}

export const kumaService =
  new KumaService();