import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { LOCK_TIMEOUT_PRESETS } from "@/src/modules/settings/types/appSettings";
import { useVaultStore } from "@/src/modules/vault/store/vault.store";
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from "@/src/modules/vault/utils/biometrics";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { Screen } from "@/src/shared/components/Screen";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

export default function SecuritySettingsScreen() {
  const { t } = useTranslation();
  const vaultEnabled = useVaultStore(
    (state) => state.enabled,
  );
  const enableVault = useVaultStore(
    (state) => state.enableVault,
  );
  const disableVault = useVaultStore(
    (state) => state.disableVault,
  );
  const lock = useVaultStore((state) => state.lock);
  const biometricUnlockEnabled =
    useAppSettingsStore(
      (state) => state.biometricUnlockEnabled,
    );
  const setBiometricUnlockEnabled =
    useAppSettingsStore(
      (state) => state.setBiometricUnlockEnabled,
    );
  const lockTimeoutMinutes = useAppSettingsStore(
    (state) => state.lockTimeoutMinutes,
  );
  const setLockTimeoutMinutes =
    useAppSettingsStore(
      (state) => state.setLockTimeoutMinutes,
    );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [info, setInfo] = useState<string | null>(
    null,
  );
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);
  const [showDisableModal, setShowDisableModal] =
    useState(false);

  useEffect(() => {
    void getBiometricAvailability().then(
      (availability) => {
        setBiometricAvailable(
          availability.available,
        );
      },
    );
  }, []);

  async function handleEnable(): Promise<void> {
    setError(null);

    if (password.trim().length < 6) {
      setError(t("vault.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("vault.passwordMismatch"));
      return;
    }

    setBusy(true);

    try {
      await enableVault(password);
      setPassword("");
      setConfirmPassword("");
      setInfo(t("vault.enabledSuccess"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await disableVault(password);
      setBiometricUnlockEnabled(false);
      setPassword("");
      setConfirmPassword("");
      setShowDisableModal(false);
      setInfo(t("vault.disabledSuccess"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleBiometric(
    enabled: boolean,
  ): Promise<void> {
    if (!enabled) {
      setBiometricUnlockEnabled(false);
      return;
    }

    if (!vaultEnabled) {
      setError(t("vault.biometricNeedsVault"));
      return;
    }

    if (!biometricAvailable) {
      setError(t("vault.biometricUnavailable"));
      return;
    }

    const ok = await authenticateWithBiometrics(
      t("vault.biometricPrompt"),
    );

    if (ok) {
      setBiometricUnlockEnabled(true);
      setError(null);
    }
  }

  function timeoutLabel(minutes: number): string {
    if (minutes <= 0) {
      return t("vault.timeoutImmediate");
    }

    return t("vault.timeoutMinutes", {
      minutes,
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("vault.securityTitle"),
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
            {t("vault.securityTitle")}
          </Text>
          <Text style={styles.subtitle}>
            {t("vault.securitySubtitle")}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="password"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>
              {t("vault.masterPassword")}
            </Text>
          </View>
          <Text style={styles.cardHint}>
            {vaultEnabled
              ? t("vault.masterPasswordEnabledHint")
              : t("vault.masterPasswordHint")}
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            placeholder={t(
              "vault.passwordPlaceholder",
            )}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          {!vaultEnabled ? (
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              placeholder={t(
                "vault.confirmPasswordPlaceholder",
              )}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          ) : null}

          {vaultEnabled ? (
            <View style={styles.rowActions}>
              <Pressable
                disabled={busy}
                onPress={() => {
                  lock();
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("vault.lockNow")}
                </Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() =>
                  setShowDisableModal(true)
                }
                style={({ pressed }) => [
                  styles.dangerButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.dangerButtonText}>
                  {t("vault.disable")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={busy}
              onPress={() => {
                void handleEnable();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator
                  color={colors.background}
                />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t("vault.enable")}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.cardTitle}>
                {t("vault.biometric")}
              </Text>
              <Text style={styles.cardHint}>
                {biometricAvailable
                  ? t("vault.biometricHint")
                  : t("vault.biometricUnavailable")}
              </Text>
            </View>
            <Switch
              value={
                biometricUnlockEnabled &&
                vaultEnabled &&
                biometricAvailable
              }
              disabled={!vaultEnabled || !biometricAvailable}
              onValueChange={(value) => {
                void handleToggleBiometric(value);
              }}
              trackColor={{
                false: colors.border,
                true: colors.primaryDark,
              }}
              thumbColor={
                biometricUnlockEnabled
                  ? colors.primary
                  : colors.textMuted
              }
            />
          </View>
        </View>

        {vaultEnabled ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("vault.lockTimeout")}
            </Text>
            <Text style={styles.cardHint}>
              {t("vault.lockTimeoutHint")}
            </Text>
            <View style={styles.chips}>
              {LOCK_TIMEOUT_PRESETS.map((minutes) => {
                const selected =
                  lockTimeoutMinutes === minutes;

                return (
                  <Pressable
                    key={minutes}
                    onPress={() =>
                      setLockTimeoutMinutes(minutes)
                    }
                    style={[
                      styles.chip,
                      selected
                        ? styles.chipSelected
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected
                          ? styles.chipTextSelected
                          : null,
                      ]}
                    >
                      {timeoutLabel(minutes)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
        {info ? (
          <Text style={styles.info}>{info}</Text>
        ) : null}

        <Text style={styles.warning}>
          {t("vault.recoveryWarning")}
        </Text>
      </Screen>

      <ConfirmModal
        visible={showDisableModal}
        title={t("vault.disableTitle")}
        description={t("vault.disableDescription")}
        confirmLabel={t("vault.disable")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={busy}
        onConfirm={() => {
          void handleDisable();
        }}
        onCancel={() => setShowDisableModal(false)}
      />
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
  card: {
    marginBottom: spacing.lg,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  cardHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.bodyMedium,
    color: colors.background,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryButtonText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  dangerButtonText: {
    ...typography.bodyMedium,
    color: colors.background,
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  switchInfo: {
    flex: 1,
    gap: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.background,
    fontWeight: "700",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  info: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  warning: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});
