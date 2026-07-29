import { getServerCredentials } from "@/src/core/storage/serverStorage";
import type { ServerBackupPayload } from "@/src/modules/backup/types/serverBackup";
import { SERVER_BACKUP_FORMAT } from "@/src/modules/backup/types/serverBackup";
import { useMonitorPreferencesStore } from "@/src/modules/monitor/store/monitorPreferences.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import {
  loadNotificationPreferences,
} from "@/src/notifications/NotificationPreferences";
import {
  encryptUtf8,
  type EncryptedBlob,
} from "@/src/modules/vault/utils/crypto";
import { saveEncryptedBackupFile } from "@/src/modules/backup/utils/saveBackupFile";

export async function buildServerBackupPayload(
  serverIds: string[],
): Promise<ServerBackupPayload> {
  await useMonitorPreferencesStore.getState().hydrate();

  const servers = useServerStore.getState().servers;
  const slaTargetByServer =
    useAppSettingsStore.getState().slaTargetByServer;
  const locale = useAppSettingsStore.getState().locale;
  const favorites =
    useMonitorPreferencesStore.getState()
      .favoriteIdsByServer;
  const notificationPreferences =
    await loadNotificationPreferences();

  const selected = servers.filter((server) =>
    serverIds.includes(server.id),
  );

  if (selected.length === 0) {
    throw new Error(
      "Selecciona al menos un servidor",
    );
  }

  const entries = await Promise.all(
    selected.map(async (server) => {
      const credentials =
        await getServerCredentials(server.id);

      return {
        name: server.name,
        url: server.url,
        username: server.username,
        password: credentials?.password ?? "",
        hasTwoFactor: server.hasTwoFactor,
        slaTarget:
          typeof slaTargetByServer[server.id] ===
          "number"
            ? slaTargetByServer[server.id]!
            : null,
        favoriteMonitorIds: [
          ...(favorites[server.id] ?? []),
        ],
      };
    }),
  );

  return {
    format: SERVER_BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    app: {
      locale,
      notificationPreferences,
    },
    servers: entries,
  };
}

export async function exportServerBackup(input: {
  serverIds: string[];
  passphrase: string;
}): Promise<{ filename: string; uri: string }> {
  const payload = await buildServerBackupPayload(
    input.serverIds,
  );
  const encrypted = await encryptUtf8(
    JSON.stringify(payload),
    input.passphrase,
  );

  return saveEncryptedBackupFile({
    contents: encrypted as EncryptedBlob,
    label:
      payload.servers.length === 1
        ? payload.servers[0]!.name
        : `${payload.servers.length}-servers`,
  });
}
