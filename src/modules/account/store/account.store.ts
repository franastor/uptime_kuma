import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

// Backend kumapulse-push (login multi-usuario).
const envUrl = process.env.EXPO_PUBLIC_PUSH_BACKEND_URL;
const envKey = process.env.EXPO_PUBLIC_PUSH_APP_KEY;

export const PUSH_BACKEND_URL =
  envUrl || "http://192.168.1.18:5830";
export const PUSH_BACKEND_APP_KEY = envKey || "";

const ACCOUNT_STORAGE_KEY = "kuma.account.v1";
const ACCOUNT_SECURE_KEY = "kuma.account.credentials";

export type AccountSession = {
  userId: string;
  email: string;
  webhookKey: string;
  registeredAt: string;
};

type AccountStore = {
  session: AccountSession | null;
  hydrated: boolean;
  busy: boolean;

  hydrate: () => Promise<void>;
  register: (
    email: string,
    password: string,
  ) => Promise<AccountSession>;
  login: (
    email: string,
    password: string,
  ) => Promise<AccountSession>;
  logout: () => Promise<void>;
};

async function saveSession(
  session: AccountSession | null,
): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(ACCOUNT_SECURE_KEY);
    }
    return;
  }

  await AsyncStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify({
      userId: session.userId,
      email: session.email,
      webhookKey: session.webhookKey,
      registeredAt: session.registeredAt,
    }),
  );
}

async function loadSession(): Promise<AccountSession | null> {
  const stored = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AccountSession;
  } catch {
    return null;
  }
}

async function apiCall<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${PUSH_BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": PUSH_BACKEND_APP_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    userId?: string;
    webhookKey?: string;
  };

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ||
        "No se pudo completar la operación. Revisa tu conexión.",
    );
  }

  return data as unknown as T;
}

export const useAccountStore = create<AccountStore>((set) => ({
  session: null,
  hydrated: false,
  busy: false,

  hydrate: async () => {
    try {
      const session = await loadSession();
      set({ session, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  register: async (email, password) => {
    set({ busy: true });
    try {
      const result = await apiCall<{
        userId: string;
        webhookKey: string;
      }>("/api/auth/register", {
        email,
        password,
      });

      const session: AccountSession = {
        userId: result.userId,
        email: email.trim().toLowerCase(),
        webhookKey: result.webhookKey,
        registeredAt: new Date().toISOString(),
      };

      await saveSession(session);
      set({ session, busy: false });
      return session;
    } catch (error) {
      set({ busy: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ busy: true });
    try {
      const result = await apiCall<{
        userId: string;
        webhookKey: string;
      }>("/api/auth/login", {
        email,
        password,
      });

      const session: AccountSession = {
        userId: result.userId,
        email: email.trim().toLowerCase(),
        webhookKey: result.webhookKey,
        registeredAt: new Date().toISOString(),
      };

      await saveSession(session);
      set({ session, busy: false });
      return session;
    } catch (error) {
      set({ busy: false });
      throw error;
    }
  },

  logout: async () => {
    await saveSession(null);
    set({ session: null });
  },
}));
