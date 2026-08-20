import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { LanguagePicker } from "@/src/modules/settings/components/LanguagePicker";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { Screen } from "@/src/shared/components/Screen";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

export default function SettingsScreen() {
  const { t, locale, setLocale } = useTranslation();
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const setPlan = useSubscriptionStore(
    (state) => state.setPlan,
  );
  const isPremium = plan === "premium";

  return (
    <>
      <Stack.Screen
        options={{
          title: t("settings.title"),
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
            {t("settings.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("settings.subtitle")}
          </Text>
        </View>

        <LanguagePicker
          value={locale}
          onChange={setLocale}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push("/settings/security")
          }
          style={({ pressed }) => [
            styles.linkCard,
            pressed ? styles.linkCardPressed : null,
          ]}
        >
          <View style={styles.linkIcon}>
            <MaterialIcons
              name="lock"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              {t("settings.security")}
            </Text>
            <Text style={styles.linkDescription}>
              {t("settings.securityHint")}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push("/settings/backup")
          }
          style={({ pressed }) => [
            styles.linkCard,
            pressed ? styles.linkCardPressed : null,
          ]}
        >
          <View style={styles.linkIcon}>
            <MaterialIcons
              name="import-export"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              {t("settings.backup")}
            </Text>
            <Text style={styles.linkDescription}>
              {t("settings.backupHint")}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push("/settings/premium")
          }
          style={({ pressed }) => [
            styles.linkCard,
            pressed ? styles.linkCardPressed : null,
          ]}
        >
          <View style={styles.linkIcon}>
            <MaterialIcons
              name="workspace-premium"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              KumaPulse Premium
            </Text>
            <Text style={styles.linkDescription}>
              Suscripción, features premium y restaurar compras
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push("/settings/account")
          }
          style={({ pressed }) => [
            styles.linkCard,
            pressed ? styles.linkCardPressed : null,
          ]}
        >
          <View style={styles.linkIcon}>
            <MaterialIcons
              name="account-circle"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              Cuenta y push
            </Text>
            <Text style={styles.linkDescription}>
              Inicia sesión para recibir avisos push en tus dispositivos
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(
              "/settings/notifications",
            )
          }
          style={({ pressed }) => [
            styles.linkCard,
            pressed ? styles.linkCardPressed : null,
          ]}
        >
          <View style={styles.linkIcon}>
            <MaterialIcons
              name="notifications-active"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.linkInfo}>
            <Text style={styles.linkTitle}>
              {t("settings.notifications")}
            </Text>
            <Text style={styles.linkDescription}>
              {t("settings.notificationsHint")}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>

        {(__DEV__ ||
        process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS ===
          "true") ? (
          <View style={styles.devCard}>
            <View style={styles.devHeader}>
              <MaterialIcons
                name="developer-mode"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.devBadge}>
                {t("settings.devOnly")}
              </Text>
            </View>
            <View style={styles.devRow}>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>
                  {t("settings.premiumPlan")}
                </Text>
                <Text style={styles.linkDescription}>
                  {t("settings.premiumPlanHint")}
                </Text>
              </View>
              <Switch
                value={isPremium}
                onValueChange={(enabled) =>
                  setPlan(
                    enabled ? "premium" : "free",
                  )
                }
                trackColor={{
                  false: colors.border,
                  true: colors.primaryDark,
                }}
                thumbColor={
                  isPremium
                    ? colors.primary
                    : colors.textMuted
                }
              />
            </View>
          </View>
        ) : null}

        <Text style={styles.hint}>
          {t("settings.slaHint")}
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  linkCard: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  linkCardPressed: {
    opacity: 0.75,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  linkInfo: {
    flex: 1,
    gap: 2,
  },
  linkTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  linkDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  devCard: {
    marginTop: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 16,
    padding: spacing.lg,
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  devBadge: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "800",
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
