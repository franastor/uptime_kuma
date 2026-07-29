import { KumaSocket } from "@/src/core/socket/KumaSocket";

import {
  KumaAuthenticationError,
  KumaConnectionError,
  KumaTwoFactorRequiredError,
} from "@/src/core/socket/kumaSocket.types";

import {
  deleteServerSession,
  getServerCredentials,
  getServerSession,
  saveServerSession,
} from "@/src/core/storage/serverStorage";

import { useServerStore } from "@/src/modules/servers/store/server.store";

import type {
  ServerConnectionStatus,
} from "@/src/modules/servers/types/server";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";

import type {
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";

import { normalizeMonitorList } from "@/src/modules/monitor/utils/normalizeMonitor";
import {
  normalizeKumaHeartbeat,
  normalizeKumaHeartbeatList,
} from "@/src/modules/monitor/utils/normalizeHeartbeat";
import { createHeartbeatRecord } from "@/src/modules/monitor/utils/createHeartbeatRecord";

import {
  createTimelineEventFromHeartbeat,
  createTimelineEventsFromMonitorHeartbeats,
  useTimelineStore,
} from "@/src/modules/timeline";

import { notificationManager } from "@/src/notifications";

export type ConnectToKumaOptions = {
  twoFactorToken?: string;
};

export type KumaConnectionResult = {
  authenticated: true;
  sessionToken?: string;
};

const RECONNECT_AUTH_ERROR =
  "La sesión ha caducado. Vuelve a conectarte para validar el acceso.";

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

function normalizeCertificateInfo(
  payload: unknown,
): {
  certificateDaysRemaining: number | null;
  certificateValid: boolean | null;
} {
  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return {
      certificateDaysRemaining: null,
      certificateValid: null,
    };
  }

  const candidate = payload as {
    valid?: unknown;
    certInfo?: {
      daysRemaining?: unknown;
    };
  };
  const rawDays =
    candidate.certInfo?.daysRemaining;
  const days =
    typeof rawDays === "number"
      ? rawDays
      : typeof rawDays === "string"
        ? Number(rawDays)
        : NaN;

  return {
    certificateDaysRemaining:
      Number.isFinite(days) ? days : null,
    certificateValid:
      typeof candidate.valid === "boolean"
        ? candidate.valid
        : null,
  };
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
        const monitors =
          normalizeMonitorList(monitorList);

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
        const monitors =
          normalizeMonitorList(monitorList);

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
      (rawHeartbeat) => {
        const heartbeat =
          normalizeKumaHeartbeat(
            rawHeartbeat,
          );

        if (!heartbeat) {
          return;
        }

        const heartbeatRecord =
          createHeartbeatRecord(
            serverId,
            heartbeat,
          );

        if (heartbeatRecord) {
          useHeartbeatHistoryStore
            .getState()
            .append([heartbeatRecord]);
        }

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

        const timelineEvent =
          createTimelineEventFromHeartbeat(
            heartbeat,
            {
              serverId,
              serverName: server.name,
              monitorName: monitor.name,
              previousStatus:
                monitor.previousStatus,
            },
          );

        if (timelineEvent) {
          void useTimelineStore
            .getState()
            .appendEvents([
              timelineEvent,
            ]);
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

    socket.setHeartbeatListListener(
      (monitorId, heartbeats, _overwrite) => {
        this.ingestMonitorHeartbeatHistory(
          serverId,
          server.name,
          monitorId,
          heartbeats,
          {
            updateMonitorState: true,
            onlyImportant: true,
          },
        );
      },
    );

    socket.setImportantHeartbeatListListener(
      (monitorId, heartbeats, _overwrite) => {
        this.ingestMonitorHeartbeatHistory(
          serverId,
          server.name,
          monitorId,
          heartbeats,
          {
            updateMonitorState: false,
            onlyImportant: false,
          },
        );
      },
    );

    socket.setAveragePingListener(
      (monitorId, averagePing) => {
        useMonitorStatsStore
          .getState()
          .update(serverId, monitorId, {
            averagePing24h:
              typeof averagePing === "number" &&
              Number.isFinite(averagePing)
                ? averagePing
                : null,
          });
      },
    );

    socket.setUptimeListener(
      (monitorId, period, uptime) => {
        if (
          !Number.isFinite(uptime) ||
          (period !== 24 &&
            period !== 720 &&
            period !== "24" &&
            period !== "720")
        ) {
          return;
        }

        useMonitorStatsStore
          .getState()
          .update(serverId, monitorId, {
            ...(period === 24 ||
            period === "24"
              ? { uptime24h: uptime }
              : { uptime30d: uptime }),
          });
      },
    );

    socket.setCertificateInfoListener(
      (monitorId, certificateInfo) => {
        useMonitorStatsStore
          .getState()
          .update(
            serverId,
            monitorId,
            normalizeCertificateInfo(
              certificateInfo,
            ),
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
        void this.handleReconnectAuthentication(
          serverId,
          socket,
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
        await this.authenticateSocket(
          serverId,
          socket,
          server.username,
          credentials.password,
          options.twoFactorToken,
        );

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

  async refreshTimelineHistory(
    serverId: string,
    monitorId: number | null = null,
    count = 50,
  ): Promise<number> {
    const socket =
      this.connections.get(serverId);

    if (!socket?.connected) {
      return 0;
    }

    const server = useServerStore
      .getState()
      .servers.find(
        (item) => item.id === serverId,
      );

    if (!server) {
      return 0;
    }

    try {
      const heartbeats =
        await socket.fetchImportantHeartbeatListPaged(
          monitorId,
          0,
          count,
        );

      if (monitorId !== null) {
        this.ingestMonitorHeartbeatHistory(
          serverId,
          server.name,
          monitorId,
          heartbeats,
          {
            updateMonitorState: false,
            onlyImportant: false,
          },
        );

        return heartbeats.length;
      }

      const byMonitor = new Map<
        number,
        typeof heartbeats
      >();

      for (const raw of heartbeats) {
        const heartbeat =
          normalizeKumaHeartbeat(raw);

        if (!heartbeat) {
          continue;
        }

        const current =
          byMonitor.get(
            heartbeat.monitorID,
          ) ?? [];

        current.push(heartbeat);
        byMonitor.set(
          heartbeat.monitorID,
          current,
        );
      }

      for (const [
        id,
        list,
      ] of byMonitor.entries()) {
        this.ingestMonitorHeartbeatHistory(
          serverId,
          server.name,
          id,
          list,
          {
            updateMonitorState: false,
            onlyImportant: false,
          },
        );
      }

      return heartbeats.length;
    } catch (error) {
      console.warn(
        "No se pudo refrescar el timeline:",
        error,
      );
      return 0;
    }
  }

  private ingestMonitorHeartbeatHistory(
    serverId: string,
    serverName: string,
    monitorId: number,
    rawHeartbeats: unknown,
    options: {
      updateMonitorState: boolean;
      onlyImportant: boolean;
    },
  ): void {
    const heartbeats =
      normalizeKumaHeartbeatList(
        rawHeartbeats,
        monitorId,
      );

    if (heartbeats.length === 0) {
      return;
    }

    const heartbeatRecords = heartbeats
      .map((heartbeat) =>
        createHeartbeatRecord(
          serverId,
          heartbeat,
        ),
      )
      .filter(
        (
          record,
        ): record is NonNullable<
          typeof record
        > => record !== null,
      );

    useHeartbeatHistoryStore
      .getState()
      .append(heartbeatRecords);

    const monitors =
      useMonitorStore.getState()
        .monitorsByServer[serverId] ??
      [];

    const monitor = monitors.find(
      (item) => item.id === monitorId,
    );

    const monitorName =
      monitor?.name ??
      `Monitor ${monitorId}`;

    if (options.updateMonitorState) {
      const latest =
        heartbeats[heartbeats.length - 1];

      if (latest) {
        useMonitorStore
          .getState()
          .updateHeartbeat(serverId, {
            monitorId,
            status:
              normalizeHeartbeatStatus(
                latest.status,
              ),
            ping: latest.ping,
            message: latest.msg,
            heartbeatAt: latest.time,
            retries: latest.retries,
            important: latest.important,
          });
      }
    }

    const events =
      createTimelineEventsFromMonitorHeartbeats(
        monitorId,
        heartbeats,
        {
          serverId,
          serverName,
          monitorName,
        },
        {
          onlyImportant:
            options.onlyImportant,
        },
      );

    if (events.length > 0) {
      void useTimelineStore
        .getState()
        .appendEvents(events);
    }
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

  private async authenticateSocket(
    serverId: string,
    socket: KumaSocket,
    username: string,
    password: string,
    twoFactorToken?: string,
  ): Promise<{
    token?: string;
  }> {
    if (!twoFactorToken) {
      const storedSession =
        await getServerSession(serverId);

      if (storedSession) {
        try {
          await socket.loginByToken(
            storedSession.token,
          );

          return {
            token: storedSession.token,
          };
        } catch {
          await deleteServerSession(serverId);
        }
      }
    }

    const loginResponse =
      await socket.login({
        username,
        password,
        token: twoFactorToken,
      });

    if (loginResponse.token) {
      await saveServerSession(serverId, {
        token: loginResponse.token,
        issuedAt: new Date().toISOString(),
      });
    }

    return {
      token: loginResponse.token,
    };
  }

  private async handleReconnectAuthentication(
    serverId: string,
    socket: KumaSocket,
  ): Promise<void> {
    try {
      const storedSession =
        await getServerSession(serverId);

      if (!storedSession) {
        throw new KumaAuthenticationError(
          RECONNECT_AUTH_ERROR,
        );
      }

      await socket.loginByToken(
        storedSession.token,
      );

      await this.updateConnectionStatus(
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
    } catch (error) {
      await deleteServerSession(serverId);

      const message =
        error instanceof Error
          ? error.message
          : RECONNECT_AUTH_ERROR;

      await this.updateConnectionStatus(
        serverId,
        "auth-error",
        message,
      );

      useMonitorStore
        .getState()
        .setLoading(serverId, false);

      useMonitorStore
        .getState()
        .setError(
          serverId,
          message,
        );
    }
  }
}

export const kumaService =
  new KumaService();