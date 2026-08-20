import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  isRevenueCatConfigured,
  purchasePremium,
  restoreRevenueCatPurchases,
} from "@/src/modules/subscription/revenuecat";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

const PREMIUM_FEATURES: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: "notifications-active",
    title: "Avisos push ilimitados",
    description:
      "Notificaciones con la app cerrada, sin límites.",
  },
  {
    icon: "dns",
    title: "Servidores ilimitados",
    description:
      "Conecta todos los Uptime Kuma que quieras.",
  },
  {
    icon: "monitor-heart",
    title: "Monitores sin límite",
    description:
      "Vigila todos tus servicios, sin recortes.",
  },
  {
    icon: "dashboard",
    title: "Dashboard avanzado",
    description:
      "Estadísticas, SLA y ranking de estabilidad.",
  },
  {
    icon: "star",
    title: "Favoritos",
    description:
      "Acceso rápido a tus monitores clave.",
  },
  {
    icon: "history",
    title: "Centro de incidencias",
    description:
      "Historial completo de caídas y eventos.",
  },
  {
    icon: "file-download",
    title: "Exportación de datos",
    description:
      "Informes Excel, CSV y copias de seguridad.",
  },
  {
    icon: "palette",
    title: "Temas personalizados",
    description:
      "Personaliza el aspecto de la app.",
  },
];

export default function PremiumScreen() {
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const hydrated = useSubscriptionStore(
    (state) => state.hydrated,
  );
  const setPlan = useSubscriptionStore(
    (state) => state.setPlan,
  );

  const [busy, setBusy] = useState(false);
  const rcConfigured = isRevenueCatConfigured();

  useEffect(() => {
    if (!hydrated) {
      void useSubscriptionStore
        .getState()
        .hydrate();
    }
  }, [hydrated]);

  const isPremium = plan === "premium";

  async function handlePurchase(): Promise<void> {
    setBusy(true);
    try {
      const nextPlan =
        await purchasePremium();
      setPlan(nextPlan);
      Alert.alert(
        nextPlan === "premium"
          ? "¡Bienvenido a Premium! 🎉"
          : "Compra no completada",
        nextPlan === "premium"
          ? "Ya tienes todas las funciones premium activas."
          : "No se ha podido completar la compra. Inténtalo de nuevo.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se ha podido completar la compra.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(): Promise<void> {
    setBusy(true);
    try {
      const nextPlan =
        await restoreRevenueCatPurchases();
      setPlan(nextPlan);
      Alert.alert(
        "Compras restauradas",
        nextPlan === "premium"
          ? "Tu suscripción Premium está activa."
          : "No se ha encontrado ninguna compra previa.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se han podido restaurar las compras.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "KumaPulse Premium",
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
          <View style={styles.logoBadge}>
            <MaterialIcons
              name="workspace-premium"
              size={40}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>
            {isPremium
              ? "Eres Premium"
              : "Hazte Premium"}
          </Text>
          <Text style={styles.subtitle}>
            {isPremium
              ? "Tienes todas las funciones premium activas."
              : "Desbloquea todo el potencial de KumaPulse."}
          </Text>
        </View>

        <View style={styles.features}>
          {PREMIUM_FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <MaterialIcons
                  name={feature.icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>
                  {feature.title}
                </Text>
                <Text
                  style={
                    styles.featureDescription
                  }
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!rcConfigured ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              Las compras se activarán pronto. Mientras
              tanto, puedes probar Premium desde el
              desarrollo de la app.
            </Text>
          </View>
        ) : isPremium ? (
          <AppButton
            title="Ya eres Premium"
            disabled
          />
        ) : (
          <AppButton
            title="Hazte Premium"
            loading={busy}
            onPress={() => {
              void handlePurchase();
            }}
          />
        )}

        {(__DEV__ ||
        process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS ===
          "true") ? (
          <View style={styles.testBox}>
            <Text style={styles.testTitle}>
              Modo prueba (solo builds de test)
            </Text>
            <Text style={styles.testText}>
              Alterna el plan local sin comprar nada, para
              probar el gating free/premium.
            </Text>
            <AppButton
              title={
                isPremium
                  ? "Volver a Free (test)"
                  : "Activar Premium (test)"
              }
              onPress={() =>
                setPlan(
                  isPremium ? "free" : "premium",
                )
              }
            />
          </View>
        ) : null}

        <AppButton
          title="Restaurar compras"
          disabled={busy || !rcConfigured}
          onPress={() => {
            void handleRestore();
          }}
        />

        <AppButton
          title="Volver a Ajustes"
          onPress={() => router.back()}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  features: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: "700",
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  testBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  testTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: "700",
  },
  testText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  noticeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
