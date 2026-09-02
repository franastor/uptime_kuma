import { MaterialIcons } from "@expo/vector-icons";
import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useServerStore } from "@/src/modules/servers/store/server.store";
import { SlaTargetPicker } from "@/src/modules/settings/components/SlaTargetPicker";
import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { resolveSlaTarget } from "@/src/modules/settings/types/appSettings";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

export default function ServerSettingsScreen() {
  const params = useLocalSearchParams<{
    serverId?: string | string[];
  }>();
  const serverId = Array.isArray(params.serverId)
    ? params.serverId[0]
    : params.serverId;

  const server = useServerStore((state) =>
    state.servers.find(
      (item) => item.id === serverId,
    ),
  );
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const hasAdvancedDashboard = canUseFeature(
    plan,
    "advanced-dashboard",
  );
  const hydrate = useAppSettingsStore(
    (state) => state.hydrate,
  );
  const slaTargetByServer = useAppSettingsStore(
    (state) => state.slaTargetByServer,
  );
  const setSlaTarget = useAppSettingsStore(
    (state) => state.setSlaTarget,
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!serverId || !server) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Ajustes del servidor",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Screen contentContainerStyle={styles.centered}>
          <Text style={styles.notFoundTitle}>
            Servidor no encontrado
          </Text>
          <Text style={styles.notFoundDescription}>
            Vuelve al listado e entra en una
            instancia para configurar sus ajustes.
          </Text>
          <AppButton
            title="Volver"
            variant="ghost"
            onPress={() => router.back()}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Ajustes",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>
            Ajustes del servidor
          </Text>
          <Text style={styles.subtitle}>
            {server.name}
          </Text>
          <Text style={styles.url} numberOfLines={1}>
            {server.url}
          </Text>
        </View>

        {hasAdvancedDashboard ? (
          <View style={styles.card}>
            <SlaTargetPicker
              value={resolveSlaTarget(
                slaTargetByServer,
                server.id,
              )}
              onChange={(value) =>
                setSlaTarget(server.id, value)
              }
            />
          </View>
        ) : (
          <View style={styles.premiumCard}>
            <View style={styles.premiumIcon}>
              <MaterialIcons
                name="workspace-premium"
                size={22}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.premiumInformation}>
              <Text style={styles.premiumTitle}>
                Objetivo SLA
              </Text>
              <Text style={styles.premiumDescription}>
                Configurar el umbral SLA forma
                parte del Dashboard avanzado
                (Premium).
              </Text>
            </View>
            <MaterialIcons
              name="lock"
              size={20}
              color={colors.textMuted}
            />
          </View>
        )}

        <View style={styles.pushCard}>
          <View style={styles.pushHeader}>
            <MaterialIcons
              name="notifications-active"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.pushTitle}>
              Push / Webhook
            </Text>
          </View>
          <Text style={styles.pushDescription}>
            Para recibir avisos con la app cerrada,
            usa este ID de servidor en la URL del
            webhook de Uptime Kuma:
          </Text>
          <View style={styles.pushIdRow}>
            <Text
              style={styles.pushId}
              selectable
              numberOfLines={1}
            >
              {server.id}
            </Text>
          </View>
          <Text style={styles.pushHint}>
            URL: http://192.168.1.18:5830/api/webhook/
            {"<serverId>"} — mantén pulsado el ID para
            copiarlo.
          </Text>
        </View>

        <View style={styles.hint}>
          <MaterialIcons
            name="info-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text style={styles.hintText}>
            Aquí irán más preferencias de esta
            instancia cuando lleguen nuevas
            funciones.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  notFoundTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  notFoundDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  url: {
    ...typography.caption,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  premiumInformation: {
    flex: 1,
    gap: spacing.xs,
  },
  premiumTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  premiumDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hint: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  hintText: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
  },
  pushCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pushHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pushTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  pushDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pushIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  pushId: {
    ...typography.caption,
    flex: 1,
    color: colors.primary,
    fontFamily: "monospace",
  },
  pushHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
