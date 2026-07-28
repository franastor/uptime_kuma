import {
  io,
  type Socket,
} from "socket.io-client";

import {
  KumaAuthenticationError,
  KumaConnectionError,
  KumaTwoFactorRequiredError,
  type KumaLoginCredentials,
  type KumaLoginResponse,
  type KumaSocketConnectionOptions,
  type KumaSocketDisconnectReason,
} from "@/src/core/socket/kumaSocket.types";

import type {
  KumaHeartbeat,
  KumaMonitor,
} from "@/src/modules/monitor/types/monitor";

type DisconnectListener = (
  reason: KumaSocketDisconnectReason,
) => void;

type ConnectionErrorListener = (
  error: Error,
) => void;

type ReconnectAttemptListener = (
  attempt: number,
) => void;

type ReconnectListener = (
  attempt: number,
) => void;

type ReconnectErrorListener = (
  error: Error,
) => void;

type ReconnectFailedListener = () => void;

export type KumaMonitorList =
  Record<string, KumaMonitor>;

type MonitorListListener = (
  monitors: KumaMonitorList,
) => void;

type MonitorUpdateListener = (
  monitors: KumaMonitorList,
) => void;

type MonitorDeleteListener = (
  monitorId: number,
) => void;

type HeartbeatListener = (
  heartbeat: KumaHeartbeat,
) => void;

const DEFAULT_CONNECTION_TIMEOUT =
  15_000;

const DEFAULT_LOGIN_TIMEOUT =
  15_000;

export class KumaSocket {
  private socket: Socket | null =
    null;

  private disconnectListener:
    | DisconnectListener
    | null = null;

  private connectionErrorListener:
    | ConnectionErrorListener
    | null = null;

  private reconnectAttemptListener:
    | ReconnectAttemptListener
    | null = null;

  private reconnectListener:
    | ReconnectListener
    | null = null;

  private reconnectErrorListener:
    | ReconnectErrorListener
    | null = null;

  private reconnectFailedListener:
    | ReconnectFailedListener
    | null = null;

  private monitorListListener:
    | MonitorListListener
    | null = null;

  private monitorUpdateListener:
    | MonitorUpdateListener
    | null = null;

  private monitorDeleteListener:
    | MonitorDeleteListener
    | null = null;

  private heartbeatListener:
    | HeartbeatListener
    | null = null;

  get connected(): boolean {
    return (
      this.socket?.connected ??
      false
    );
  }

  setDisconnectListener(
    listener:
      | DisconnectListener
      | null,
  ): void {
    this.disconnectListener =
      listener;
  }

  setConnectionErrorListener(
    listener:
      | ConnectionErrorListener
      | null,
  ): void {
    this.connectionErrorListener =
      listener;
  }

  setReconnectAttemptListener(
    listener:
      | ReconnectAttemptListener
      | null,
  ): void {
    this.reconnectAttemptListener =
      listener;
  }

  setReconnectListener(
    listener:
      | ReconnectListener
      | null,
  ): void {
    this.reconnectListener =
      listener;
  }

  setReconnectErrorListener(
    listener:
      | ReconnectErrorListener
      | null,
  ): void {
    this.reconnectErrorListener =
      listener;
  }

  setReconnectFailedListener(
    listener:
      | ReconnectFailedListener
      | null,
  ): void {
    this.reconnectFailedListener =
      listener;
  }

  setMonitorListListener(
    listener:
      | MonitorListListener
      | null,
  ): void {
    this.monitorListListener =
      listener;
  }

  setMonitorUpdateListener(
    listener:
      | MonitorUpdateListener
      | null,
  ): void {
    this.monitorUpdateListener =
      listener;
  }

  setMonitorDeleteListener(
    listener:
      | MonitorDeleteListener
      | null,
  ): void {
    this.monitorDeleteListener =
      listener;
  }

  setHeartbeatListener(
    listener:
      | HeartbeatListener
      | null,
  ): void {
    this.heartbeatListener =
      listener;
  }

  async connect({
    url,
    timeout =
      DEFAULT_CONNECTION_TIMEOUT,
  }: KumaSocketConnectionOptions): Promise<void> {
    this.disconnect();

    const normalizedUrl =
      this.normalizeUrl(url);

    const socket = io(
      normalizedUrl,
      {
        autoConnect: false,

        transports: [
          "websocket",
        ],

        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 5_000,

        timeout,
      },
    );

    this.socket = socket;

    this.registerLifecycleListeners(
      socket,
    );

    this.registerDataListeners(
      socket,
    );

    await new Promise<void>(
      (resolve, reject) => {
        let completed = false;

        const finish = (
          callback: () => void,
        ): void => {
          if (completed) {
            return;
          }

          completed = true;

          socket.off(
            "connect",
            handleConnect,
          );

          socket.off(
            "connect_error",
            handleConnectionError,
          );

          callback();
        };

        const handleConnect =
          (): void => {
            finish(resolve);
          };

        const handleConnectionError =
          (
            error: Error,
          ): void => {
            finish(() => {
              reject(
                new KumaConnectionError(
                  error.message ||
                    "No se ha podido conectar con Uptime Kuma.",
                ),
              );
            });
          };

        socket.once(
          "connect",
          handleConnect,
        );

        socket.once(
          "connect_error",
          handleConnectionError,
        );

        socket.connect();
      },
    );
  }

  async login(
    credentials:
      KumaLoginCredentials,
  ): Promise<KumaLoginResponse> {
    const socket =
      this.getConnectedSocket();

    const response =
      await this.emitWithCallback<
        KumaLoginCredentials,
        KumaLoginResponse
      >(
        socket,
        "login",
        credentials,
        DEFAULT_LOGIN_TIMEOUT,
      );

    if (
      response.tokenRequired
    ) {
      throw new KumaTwoFactorRequiredError();
    }

    if (!response.ok) {
      throw new KumaAuthenticationError(
        response.msg ||
          "Usuario o contraseña incorrectos.",
      );
    }

    return response;
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket
      .removeAllListeners();

    this.socket.io
      .removeAllListeners();

    this.socket.disconnect();

    this.socket = null;
  }

  private registerLifecycleListeners(
    socket: Socket,
  ): void {
    socket.on(
      "disconnect",
      (
        reason:
          KumaSocketDisconnectReason,
      ) => {
        this.disconnectListener?.(
          reason,
        );
      },
    );

    socket.on(
      "connect_error",
      (error: Error) => {
        this.connectionErrorListener?.(
          error,
        );
      },
    );

    socket.io.on(
      "reconnect_attempt",
      (attempt: number) => {
        this.reconnectAttemptListener?.(
          attempt,
        );
      },
    );

    socket.io.on(
      "reconnect",
      (attempt: number) => {
        this.reconnectListener?.(
          attempt,
        );
      },
    );

    socket.io.on(
      "reconnect_error",
      (error: Error) => {
        this.reconnectErrorListener?.(
          error,
        );
      },
    );

    socket.io.on(
      "reconnect_failed",
      () => {
        this.reconnectFailedListener?.();
      },
    );
  }

  private registerDataListeners(
    socket: Socket,
  ): void {
    socket.on(
      "monitorList",
      (
        monitorList:
          KumaMonitorList,
      ) => {
        this.monitorListListener?.(
          monitorList,
        );
      },
    );

    socket.on(
      "updateMonitorIntoList",
      (payload) => {
        console.log(
          "UPDATE MONITOR",
          JSON.stringify(
            payload,
            null,
            2,
          ),
        );
    
        this.monitorUpdateListener?.(
          payload,
        );
      },
    );

    socket.on(
      "deleteMonitorFromList",
      (
        monitorId: number,
      ) => {
        this.monitorDeleteListener?.(
          monitorId,
        );
      },
    );

    socket.on(
      "heartbeat",
      (
        heartbeat:
          KumaHeartbeat,
      ) => {
        this.heartbeatListener?.(
          heartbeat,
        );
      },
    );
  }

  private getConnectedSocket(): Socket {
    if (
      !this.socket?.connected
    ) {
      throw new KumaConnectionError(
        "No existe una conexión activa con Uptime Kuma.",
      );
    }

    return this.socket;
  }

  private emitWithCallback<
    TPayload,
    TResponse,
  >(
    socket: Socket,
    event: string,
    payload: TPayload,
    timeout: number,
  ): Promise<TResponse> {
    return new Promise<TResponse>(
      (resolve, reject) => {
        const timeoutId =
          setTimeout(
            () => {
              reject(
                new KumaConnectionError(
                  `Uptime Kuma no respondió al evento "${event}".`,
                ),
              );
            },
            timeout,
          );

        socket.emit(
          event,
          payload,
          (
            response:
              TResponse,
          ) => {
            clearTimeout(
              timeoutId,
            );

            resolve(response);
          },
        );
      },
    );
  }

  private normalizeUrl(
    url: string,
  ): string {
    return url
      .trim()
      .replace(/\/+$/, "");
  }
}