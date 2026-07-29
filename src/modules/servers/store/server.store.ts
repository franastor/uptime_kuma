import { create } from "zustand";

import {
  deleteServerCredentials,
  deleteServerSession,
  getActiveServerId,
  getStoredServers,
  saveActiveServerId,
  saveServerCredentials,
  saveStoredServers,
} from "@/src/core/storage/serverStorage";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";

import type {
  CreateKumaServerInput,
  KumaServer,
  UpdateKumaServerInput,
  UpdateServerConnectionInput,
  UpdateServerSyncInput,
} from "@/src/modules/servers/types/server";

type ServerStore = {
  servers: KumaServer[];
  activeServerId: string | null;
  hydrated: boolean;
  saving: boolean;

  hydrate: () => Promise<void>;

  addServer: (
    input: CreateKumaServerInput,
  ) => Promise<KumaServer>;

  updateServer: (
    input: UpdateKumaServerInput,
  ) => Promise<KumaServer>;

  deleteServer: (
    serverId: string,
  ) => Promise<void>;

  setActiveServer: (
    serverId: string | null,
  ) => Promise<void>;

  updateConnectionStatus: (
    input: UpdateServerConnectionInput,
  ) => Promise<void>;

  updateLastSyncAt: (
    input: UpdateServerSyncInput,
  ) => Promise<void>;
};

function createServerId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeServerUrl(
  url: string,
): string {
  return url
    .trim()
    .replace(/\/+$/, "");
}

function migrateServer(
  server: KumaServer,
): KumaServer {
  return {
    ...server,
    connectionStatus:
      server.connectionStatus ?? "never",
    lastConnectionAt:
      server.lastConnectionAt ?? null,
    lastSyncAt:
      server.lastSyncAt ?? null,
    lastConnectionError:
      server.lastConnectionError ?? null,
  };
}

export const useServerStore =
  create<ServerStore>((set, get) => ({
    servers: [],
    activeServerId: null,
    hydrated: false,
    saving: false,

    hydrate: async () => {
      try {
        const [
          storedServers,
          storedActiveServerId,
        ] = await Promise.all([
          getStoredServers(),
          getActiveServerId(),
        ]);

        const servers =
          storedServers.map(migrateServer);

        const activeServerExists =
          servers.some(
            (server) =>
              server.id ===
              storedActiveServerId,
          );

        if (
          JSON.stringify(servers) !==
          JSON.stringify(storedServers)
        ) {
          await saveStoredServers(
            servers,
          );
        }

        set({
          servers,
          activeServerId:
            activeServerExists
              ? storedActiveServerId
              : null,
          hydrated: true,
        });
      } catch (error) {
        console.error(
          "Error hydrating servers:",
          error,
        );

        set({
          hydrated: true,
        });
      }
    },

    addServer: async (input) => {
      set({
        saving: true,
      });

      try {
        const now =
          new Date().toISOString();

        const server: KumaServer = {
          id: createServerId(),
          name: input.name.trim(),
          url: normalizeServerUrl(
            input.url,
          ),
          username:
            input.username.trim(),
          hasTwoFactor:
            input.hasTwoFactor,

          connectionStatus: "never",
          lastConnectionAt: null,
          lastSyncAt: null,
          lastConnectionError: null,

          createdAt: now,
          updatedAt: now,
        };

        const updatedServers = [
          ...get().servers,
          server,
        ];

        await Promise.all([
          saveStoredServers(
            updatedServers,
          ),

          saveServerCredentials(
            server.id,
            {
              password:
                input.password,
            },
          ),

          saveActiveServerId(
            server.id,
          ),
        ]);

        set({
          servers: updatedServers,
          activeServerId:
            server.id,
        });

        return server;
      } finally {
        set({
          saving: false,
        });
      }
    },

    updateServer: async (input) => {
      set({
        saving: true,
      });

      try {
        const currentServer =
          get().servers.find(
            (server) =>
              server.id ===
              input.serverId,
          );

        if (!currentServer) {
          throw new Error(
            "El servidor que quieres editar no existe.",
          );
        }

        const now =
          new Date().toISOString();

        const updatedServer: KumaServer = {
          ...currentServer,

          name: input.name.trim(),

          url: normalizeServerUrl(
            input.url,
          ),

          username:
            input.username.trim(),

          hasTwoFactor:
            input.hasTwoFactor,

          connectionStatus: "never",
          lastConnectionAt: null,
          lastSyncAt: null,
          lastConnectionError: null,

          updatedAt: now,
        };

        const updatedServers =
          get().servers.map(
            (server) =>
              server.id ===
              input.serverId
                ? updatedServer
                : server,
          );

        await Promise.all([
          saveStoredServers(
            updatedServers,
          ),

          saveServerCredentials(
            input.serverId,
            {
              password:
                input.password,
            },
          ),

          saveActiveServerId(
            input.serverId,
          ),

          deleteServerSession(
            input.serverId,
          ),
        ]);

        set({
          servers:
            updatedServers,
          activeServerId:
            input.serverId,
        });

        return updatedServer;
      } finally {
        set({
          saving: false,
        });
      }
    },

    deleteServer: async (
      serverId,
    ) => {
      const currentState =
        get();

      const updatedServers =
        currentState.servers.filter(
          (server) =>
            server.id !==
            serverId,
        );

      const nextActiveServerId =
        currentState.activeServerId ===
        serverId
          ? updatedServers[0]?.id ??
            null
          : currentState.activeServerId;

      await Promise.all([
        saveStoredServers(
          updatedServers,
        ),

        deleteServerCredentials(
          serverId,
        ),

        deleteServerSession(
          serverId,
        ),

        useTimelineStore
          .getState()
          .clearServer(serverId),

        saveActiveServerId(
          nextActiveServerId,
        ),
      ]);

      useMonitorStore
        .getState()
        .clearServer(serverId);
      useHeartbeatHistoryStore
        .getState()
        .clearServer(serverId);
      useMonitorStatsStore
        .getState()
        .clearServer(serverId);

      set({
        servers: updatedServers,
        activeServerId:
          nextActiveServerId,
      });
    },

    setActiveServer: async (
      serverId,
    ) => {
      await saveActiveServerId(
        serverId,
      );

      set({
        activeServerId:
          serverId,
      });
    },

    updateConnectionStatus:
      async ({
        serverId,
        status,
        error = null,
      }) => {
        const now =
          new Date().toISOString();

        const updatedServers =
          get().servers.map(
            (server) => {
              if (
                server.id !==
                serverId
              ) {
                return server;
              }

              return {
                ...server,

                connectionStatus:
                  status,

                lastConnectionAt:
                  status ===
                  "connected"
                    ? now
                    : server.lastConnectionAt,

                lastConnectionError:
                  error,

                updatedAt: now,
              };
            },
          );

        await saveStoredServers(
          updatedServers,
        );

        set({
          servers:
            updatedServers,
        });
      },

    updateLastSyncAt: async ({
      serverId,
      syncedAt,
    }) => {
      const now =
        syncedAt ??
        new Date().toISOString();

      const updatedServers =
        get().servers.map(
          (server) => {
            if (
              server.id !==
              serverId
            ) {
              return server;
            }

            return {
              ...server,
              lastSyncAt: now,
              updatedAt: now,
            };
          },
        );

      await saveStoredServers(
        updatedServers,
      );

      set({
        servers:
          updatedServers,
      });
    },
  }));