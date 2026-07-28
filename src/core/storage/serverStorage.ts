import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type {
  KumaServer,
  KumaServerCredentials,
} from "@/src/modules/servers/types/server";

const SERVERS_STORAGE_KEY = "kuma.servers";
const ACTIVE_SERVER_STORAGE_KEY = "kuma.activeServerId";

function getCredentialsKey(serverId: string) {
  return `kuma.credentials.${serverId}`;
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
  await SecureStore.setItemAsync(
    getCredentialsKey(serverId),
    JSON.stringify(credentials),
  );
}

export async function getServerCredentials(
  serverId: string,
): Promise<KumaServerCredentials | null> {
  const storedValue = await SecureStore.getItemAsync(
    getCredentialsKey(serverId),
  );

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as KumaServerCredentials;
  } catch {
    await SecureStore.deleteItemAsync(getCredentialsKey(serverId));
    return null;
  }
}

export async function deleteServerCredentials(
  serverId: string,
): Promise<void> {
  await SecureStore.deleteItemAsync(getCredentialsKey(serverId));
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