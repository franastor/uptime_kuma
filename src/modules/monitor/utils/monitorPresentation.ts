import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import type {
  Monitor,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";
import { colors } from "@/src/shared/theme";

export type MaterialIconName = ComponentProps<
  typeof MaterialIcons
>["name"];

export interface MonitorStatusInformation {
  label: string;
  color: string;
}

export function getMonitorStatusInformation(
  monitor: Monitor,
): MonitorStatusInformation {
  if (!monitor.active) {
    return {
      label: "Pausado",
      color: colors.textMuted,
    };
  }

  const statusMap: Record<
    MonitorStatus,
    MonitorStatusInformation
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
      label: "Sin datos",
      color: colors.textMuted,
    },
  };

  return statusMap[monitor.status];
}

export function getMonitorTypeLabel(
  type: string,
): string {
  const labels: Record<string, string> = {
    http: "HTTP",
    keyword: "Palabra clave",
    jsonQuery: "Consulta JSON",
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
    sqlserver: "SQL Server",
    postgres: "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    redis: "Redis",
    tailscalePing: "Tailscale",
  };

  return labels[type] ?? type.toUpperCase();
}

export function getMonitorTypeIcon(
  type: string,
): MaterialIconName {
  const icons: Record<string, MaterialIconName> = {
    http: "language",
    keyword: "manage-search",
    jsonQuery: "data-object",
    port: "settings-ethernet",
    ping: "network-ping",
    dns: "dns",
    push: "notifications-active",
    steam: "sports-esports",
    docker: "view-in-ar",
    grpcKeyword: "swap-horiz",
    radius: "router",
    group: "folder",
    mqtt: "sensors",
    sqlserver: "storage",
    postgres: "storage",
    mysql: "storage",
    mongodb: "storage",
    redis: "storage",
    tailscalePing: "hub",
  };

  return icons[type] ?? "monitor-heart";
}

export function formatHeartbeatDate(
  value: string | null,
  now = Date.now(),
): string {
  if (!value) {
    return "Sin comprobaciones";
  }

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");
  const timestamp = new Date(normalized).getTime();

  if (Number.isNaN(timestamp)) {
    return "Fecha desconocida";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - timestamp) / 1_000),
  );

  if (elapsedSeconds < 10) {
    return "Ahora";
  }

  if (elapsedSeconds < 60) {
    return `Hace ${elapsedSeconds} s`;
  }

  const minutes = Math.floor(elapsedSeconds / 60);

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
