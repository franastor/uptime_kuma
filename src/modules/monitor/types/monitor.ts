export type MonitorStatus =
  | "unknown"
  | "up"
  | "down"
  | "pending"
  | "maintenance";

export interface KumaMonitorTag {
  tag_id?: number;
  id?: number;
  name?: string;
  color?: string;
  value?: string;
}

export interface MonitorTag {
  id: number | string;
  name: string;
  color: string | null;
  value: string | null;
}

export interface KumaMonitor {
  id: number;
  name: string;
  type: string;
  url?: string;
  hostname?: string;
  port?: number;
  interval?: number;
  active?: boolean | number | string;
  description?: string;
  tags?: KumaMonitorTag[];
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
  tags: MonitorTag[];
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
