import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { notificationService } from "@/src/notifications/NotificationService";
import { useAccountStore } from "@/src/modules/account/store/account.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";

// Backend kumapulse-push (contenedor en el homelab de Fran).
// La APP_KEY solo permite registrar tokens, nunca enviar push.
// Se leen del .env de la app (EXPO_PUBLIC_*). Ver .env.example.
const envUrl = process.env.EXPO_PUBLIC_PUSH_BACKEND_URL;
const envKey = process.env.EXPO_PUBLIC_PUSH_APP_KEY;

export const PUSH_BACKEND_URL =
  envUrl || "http://192.168.1.18:5830";
export const PUSH_BACKEND_APP_KEY = envKey || "";

// projectId de EAS (app.json → extra.eas.projectId)
const EAS_PROJECT_ID = "f62f86d9-9d8c-439a-87c4-3c8a3920dc27";

/**
 * Obtiene el token push de Expo (FCM/APNs gestionado por EAS) y lo
 * registra en el backend. No-op si no hay permiso o falla silenciosamente.
 * Devuelve el token registrado, o null.
 */
export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const state =
    await notificationService.getPermissionState();

  if (state !== "granted") {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    if (!token?.data) {
      return null;
    }

    const response = await fetch(
      `${PUSH_BACKEND_URL}/api/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": PUSH_BACKEND_APP_KEY,
        },
        body: JSON.stringify({
          token: token.data,
          platform: Platform.OS,
          // Multi-usuario: asociar el token a la cuenta (si hay sesión)
          // y a los servidores que tiene configurados el usuario.
          userId: useAccountStore.getState().session?.userId ?? null,
          serverIds: useServerStore
            .getState()
            .servers.map((s) => s.id),
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    return token.data;
  } catch {
    // Expo Go / simuladores sin soporte push: silencioso.
    return null;
  }
}

/**
 * Elimina el token del backend (logout / desactivar avisos).
 */
export async function unregisterPushToken(
  token: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const response = await fetch(
      `${PUSH_BACKEND_URL}/api/unregister`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": PUSH_BACKEND_APP_KEY,
        },
        body: JSON.stringify({ token }),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}
