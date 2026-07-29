import type { NotificationPreferences } from "@/src/notifications/NotificationPreferences";
import type { AppLocalePreference } from "@/src/shared/i18n";

export const SERVER_BACKUP_FORMAT =
  "kumapulse.server-backup" as const;

export type ServerBackupEntry = {
  name: string;
  url: string;
  username: string;
  password: string;
  hasTwoFactor: boolean;
  /** Objetivo SLA (ratio 0–1), si estaba configurado. */
  slaTarget: number | null;
  favoriteMonitorIds: number[];
};

export type ServerBackupAppSettings = {
  locale: AppLocalePreference;
  notificationPreferences: NotificationPreferences;
};

export type ServerBackupPayload = {
  format: typeof SERVER_BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  app: ServerBackupAppSettings;
  servers: ServerBackupEntry[];
};

export type ServerBackupImportMode =
  | "skip"
  | "overwrite";

export type ServerBackupImportResult = {
  imported: number;
  updated: number;
  skipped: number;
};
