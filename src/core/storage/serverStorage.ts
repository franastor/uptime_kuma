import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type {
  KumaServer,
  KumaServerCredentials,
  KumaServerSession,
} from "@/src/modules/servers/types/server";

const SERVERS_STORAGE_KEY = "kuma.servers";
const ACTIVE_SERVER_STORAGE_KEY = "kuma.activeServerId";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// expo-secure-store NO existe en web (tira al usarlo). En navegador
// guardamos en AsyncStorage (localStorage) con prefijo propio; en nativo
// seguimos usando SecureStore. Así añadir/editar/borrar/conectar funciona
// en ambas plataformas.
const IS_WEB = Platform.OS === "web";
const WEB_SECURE_PREFIX = "kuma.secure.";

async function secureSetItem(key: string, value: string): Promise<void> {
  if (IS_WEB) {
    await AsyncStorage.setItem(WEB_SECURE_PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureGetItem(key: string): Promise<string | null> {
  if (IS_WEB) {
    return AsyncStorage.getItem(WEB_SECURE_PREFIX + key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDeleteItem(key: string): Promise<void> {
  if (IS_WEB) {
    await AsyncStorage.removeItem(WEB_SECURE_PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function getCredentialsKey(serverId: string) {
  return `kuma.credentials.${serverId}`;
}

function getSessionKey(serverId: string) {
  return `kuma.session.${serverId}`;
}

export async function getStoredServers(): Promise<KumaServer[]> {
  const storedValue = await AsyncStorage.getItem(SERVERS_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    return JSON.parse(storedValue) as KumaServer[];
  } catch {
    await AsyncStorage.removeItem(SERVERS_STORAGE_KEY);
    return [];
  }
}

export async function saveStoredServers(
  servers: KumaServer[],
): Promise<void> {
  await AsyncStorage.setItem(
    SERVERS_STORAGE_KEY,
    JSON.stringify(servers),
  );
}

export async function saveServerCredentials(
  serverId: string,
  credentials: KumaServerCredentials,
): Promise<void> {
  await secureSetItem(
    getCredentialsKey(serverId),
    JSON.stringify(credentials),
  );
}

export async function getServerCredentials(
  serverId: string,
): Promise<KumaServerCredentials | null> {
  const storedValue = await secureGetItem(
    getCredentialsKey(serverId),
  );

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as KumaServerCredentials;
  } catch {
    await secureDeleteItem(getCredentialsKey(serverId));
    return null;
  }
}

export async function deleteServerCredentials(
  serverId: string,
): Promise<void> {
  await secureDeleteItem(getCredentialsKey(serverId));
}

export async function saveServerSession(
  serverId: string,
  session: KumaServerSession,
): Promise<void> {
  await secureSetItem(
    getSessionKey(serverId),
    JSON.stringify(session),
  );
}

export async function getServerSession(
  serverId: string,
): Promise<KumaServerSession | null> {
  const storedValue = await secureGetItem(
    getSessionKey(serverId),
  );

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      storedValue,
    ) as KumaServerSession;

    if (
      typeof parsed.token !== "string" ||
      parsed.token.length === 0 ||
      typeof parsed.issuedAt !== "string"
    ) {
      await deleteServerSession(serverId);
      return null;
    }

    const issuedAt = Date.parse(parsed.issuedAt);

    if (
      Number.isNaN(issuedAt) ||
      Date.now() - issuedAt > SESSION_TTL_MS
    ) {
      await deleteServerSession(serverId);
      return null;
    }

    return parsed;
  } catch {
    await deleteServerSession(serverId);
    return null;
  }
}

export async function deleteServerSession(
  serverId: string,
): Promise<void> {
  await secureDeleteItem(
    getSessionKey(serverId),
  );
}

export async function saveActiveServerId(
  serverId: string | null,
): Promise<void> {
  if (!serverId) {
    await AsyncStorage.removeItem(ACTIVE_SERVER_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(
    ACTIVE_SERVER_STORAGE_KEY,
    serverId,
  );
}

export async function getActiveServerId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_SERVER_STORAGE_KEY);
}