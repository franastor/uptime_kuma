import {
  saveServerCredentials,
  saveStoredServers,
} from "@/src/core/storage/serverStorage";
import type {
  ServerBackupImportMode,
  ServerBackupImportResult,
  ServerBackupPayload,
} from "@/src/modules/backup/types/serverBackup";
import { SERVER_BACKUP_FORMAT } from "@/src/modules/backup/types/serverBackup";
import {
  decryptUtf8,
  isEncryptedBlob,
} from "@/src/modules/vault/utils/crypto";
import { useMonitorPreferencesStore } from "@/src/modules/monitor/store/monitorPreferences.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import type { KumaServer } from "@/src/modules/servers/types/server";
import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { clampSlaTarget } from "@/src/modules/settings/types/appSettings";
import {
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/src/notifications/NotificationPreferences";
import type { AppLocalePreference } from "@/src/shared/i18n";

function createServerId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function serverKey(
  url: string,
  username: string,
): string {
  return `${normalizeServerUrl(url).toLocaleLowerCase()}::${username
    .trim()
    .toLocaleLowerCase()}`;
}

function isLocale(
  value: unknown,
): value is AppLocalePreference {
  return (
    value === "system" ||
    value === "es" ||
    value === "en"
  );
}

function normalizeNotifications(
  value: unknown,
): NotificationPreferences | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return {
    enabled:
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : true,
    sound:
      typeof candidate.sound === "boolean"
        ? candidate.sound
        : true,
    vibration:
      typeof candidate.vibration === "boolean"
        ? candidate.vibration
        : true,
    tagFilterEnabled:
      typeof candidate.tagFilterEnabled ===
      "boolean"
        ? candidate.tagFilterEnabled
        : false,
    selectedTags: Array.isArray(
      candidate.selectedTags,
    )
      ? candidate.selectedTags.filter(
          (tag): tag is string =>
            typeof tag === "string",
        )
      : [],
  };
}

export function parseServerBackupPayload(
  value: unknown,
): ServerBackupPayload {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error("Backup vacío o inválido");
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  if (
    candidate.format !== SERVER_BACKUP_FORMAT ||
    candidate.version !== 1 ||
    !Array.isArray(candidate.servers)
  ) {
    throw new Error(
      "El archivo no es un backup de KumaPulse",
    );
  }

  const appRaw =
    typeof candidate.app === "object" &&
    candidate.app !== null
      ? (candidate.app as Record<string, unknown>)
      : {};

  const servers = candidate.servers
    .map((entry) => {
      if (
        typeof entry !== "object" ||
        entry === null
      ) {
        return null;
      }

      const item = entry as Record<
        string,
        unknown
      >;

      if (
        typeof item.name !== "string" ||
        typeof item.url !== "string" ||
        typeof item.username !== "string" ||
        typeof item.password !== "string"
      ) {
        return null;
      }

      return {
        name: item.name.trim(),
        url: normalizeServerUrl(item.url),
        username: item.username.trim(),
        password: item.password,
        hasTwoFactor:
          typeof item.hasTwoFactor === "boolean"
            ? item.hasTwoFactor
            : false,
        slaTarget:
          typeof item.slaTarget === "number" &&
          Number.isFinite(item.slaTarget)
            ? clampSlaTarget(item.slaTarget)
            : null,
        favoriteMonitorIds: Array.isArray(
          item.favoriteMonitorIds,
        )
          ? item.favoriteMonitorIds.filter(
              (id): id is number =>
                typeof id === "number" &&
                Number.isFinite(id),
            )
          : [],
      };
    })
    .filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== null &&
        entry.name.length > 0 &&
        entry.url.length > 0,
    );

  if (servers.length === 0) {
    throw new Error(
      "El backup no contiene servidores válidos",
    );
  }

  return {
    format: SERVER_BACKUP_FORMAT,
    version: 1,
    exportedAt:
      typeof candidate.exportedAt === "string"
        ? candidate.exportedAt
        : new Date().toISOString(),
    app: {
      locale: isLocale(appRaw.locale)
        ? appRaw.locale
        : "system",
      notificationPreferences:
        normalizeNotifications(
          appRaw.notificationPreferences,
        ) ?? {
          enabled: true,
          sound: true,
          vibration: true,
          tagFilterEnabled: false,
          selectedTags: [],
        },
    },
    servers,
  };
}

export async function decryptServerBackup(
  fileText: string,
  passphrase: string,
): Promise<ServerBackupPayload> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fileText) as unknown;
  } catch {
    throw new Error(
      "El archivo no es un JSON válido",
    );
  }

  if (!isEncryptedBlob(parsed)) {
    throw new Error(
      "El archivo no está cifrado o es inválido",
    );
  }

  let plaintext: string;

  try {
    plaintext = await decryptUtf8(
      parsed,
      passphrase,
    );
  } catch {
    throw new Error(
      "Contraseña incorrecta o archivo dañado",
    );
  }

  let payloadRaw: unknown;

  try {
    payloadRaw = JSON.parse(plaintext) as unknown;
  } catch {
    throw new Error(
      "El contenido del backup está dañado",
    );
  }

  return parseServerBackupPayload(payloadRaw);
}

export async function applyServerBackup(input: {
  payload: ServerBackupPayload;
  selectedIndexes: number[];
  duplicateMode: ServerBackupImportMode;
  importAppSettings: boolean;
}): Promise<ServerBackupImportResult> {
  const selected = input.payload.servers.filter(
    (_, index) =>
      input.selectedIndexes.includes(index),
  );

  if (selected.length === 0) {
    throw new Error(
      "Selecciona al menos un servidor para importar",
    );
  }

  const store = useServerStore.getState();
  let servers = [...store.servers];
  const favorites = {
    ...useMonitorPreferencesStore.getState()
      .favoriteIdsByServer,
  };
  const settingsStore =
    useAppSettingsStore.getState();
  let slaMap = {
    ...settingsStore.slaTargetByServer,
  };

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  const existingByKey = new Map(
    servers.map((server) => [
      serverKey(server.url, server.username),
      server,
    ]),
  );

  for (const entry of selected) {
    const key = serverKey(
      entry.url,
      entry.username,
    );
    const existing = existingByKey.get(key);
    const now = new Date().toISOString();

    if (existing) {
      if (input.duplicateMode === "skip") {
        skipped += 1;
        continue;
      }

      const nextServer: KumaServer = {
        ...existing,
        name: entry.name,
        url: entry.url,
        username: entry.username,
        hasTwoFactor: entry.hasTwoFactor,
        updatedAt: now,
      };

      servers = servers.map((server) =>
        server.id === existing.id
          ? nextServer
          : server,
      );
      existingByKey.set(key, nextServer);

      await saveServerCredentials(existing.id, {
        password: entry.password,
      });

      if (entry.slaTarget !== null) {
        slaMap = {
          ...slaMap,
          [existing.id]: entry.slaTarget,
        };
      }

      favorites[existing.id] = [
        ...entry.favoriteMonitorIds,
      ];
      updated += 1;
      continue;
    }

    const id = createServerId();
    const server: KumaServer = {
      id,
      name: entry.name,
      url: entry.url,
      username: entry.username,
      hasTwoFactor: entry.hasTwoFactor,
      connectionStatus: "never",
      lastConnectionAt: null,
      lastSyncAt: null,
      lastConnectionError: null,
      createdAt: now,
      updatedAt: now,
    };

    servers = [...servers, server];
    existingByKey.set(key, server);

    await saveServerCredentials(id, {
      password: entry.password,
    });

    if (entry.slaTarget !== null) {
      slaMap = {
        ...slaMap,
        [id]: entry.slaTarget,
      };
    }

    favorites[id] = [...entry.favoriteMonitorIds];
    imported += 1;
  }

  await saveStoredServers(servers);
  useServerStore.setState({ servers });

  await useMonitorPreferencesStore
    .getState()
    .replaceFavorites(favorites);

  useAppSettingsStore.getState().replaceSettings({
    slaTargetByServer: slaMap,
    locale: input.importAppSettings
      ? input.payload.app.locale
      : settingsStore.locale,
    biometricUnlockEnabled:
      settingsStore.biometricUnlockEnabled,
    lockTimeoutMinutes:
      settingsStore.lockTimeoutMinutes,
  });

  if (input.importAppSettings) {
    await saveNotificationPreferences(
      input.payload.app.notificationPreferences,
    );
  }

  return { imported, updated, skipped };
}
