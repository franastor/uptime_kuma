export type MonitorStatus =
  | "unknown"
  | "up"
  | "down"
  | "pending"
  | "maintenance";

export interface KumaMonitor {
  id: number;
  name: string;
  type: string;
  url?: string;
  hostname?: string;
  port?: number;
  interval?: number;
  active?: boolean;
  description?: string;
  tags?: unknown[];
}

export interface KumaHeartbeat {
  monitorID: number;
  status: number;
  time: string;
  msg: string;
  ping: number;
  important: boolean;
  retries: number;
}

export interface Monitor {
  id: number;
  name: string;
  type: string;
  target: string | null;
  interval: number | null;
  active: boolean;
  description: string | null;

  status: MonitorStatus;

  ping: number | null;

  message: string | null;

  uptime: number | null;

  lastHeartbeatAt: string | null;

  duration: number | null;

  retries: number;

  important: boolean;

  previousStatus: MonitorStatus | null;
}