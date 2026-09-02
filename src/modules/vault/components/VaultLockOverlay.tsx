import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { useVaultStore } from "@/src/modules/vault/store/vault.store";
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
} from "@/src/modules/vault/utils/biometrics";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

export function VaultLockOverlay() {
  const { t } = useTranslation();
  const hydrated = useVaultStore(
    (state) => state.hydrated,
  );
  const enabled = useVaultStore(
    (state) => state.enabled,
  );
  const unlocked = useVaultStore(
    (state) => state.unlocked,
  );
  const unlockWithPassword = useVaultStore(
    (state) => state.unlockWithPassword,
  );
  const unlockWithBiometric = useVaultStore(
    (state) => state.unlockWithBiometric,
  );
  const biometricUnlockEnabled =
    useAppSettingsStore(
      (state) => state.biometricUnlockEnabled,
    );

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);

  useEffect(() => {
    if (!enabled || unlocked) {
      return;
    }

    let cancelled = false;

    void getBiometricAvailability().then(
      (availability) => {
        if (!cancelled) {
          setBiometricAvailable(
            availability.available,
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, unlocked]);

  useEffect(() => {
    if (
      !enabled ||
      unlocked ||
      !biometricUnlockEnabled ||
      !biometricAvailable
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const ok = await authenticateWithBiometrics(
        t("vault.biometricPrompt"),
      );

      if (!cancelled && ok) {
        unlockWithBiometric();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    biometricAvailable,
    biometricUnlockEnabled,
    enabled,
    t,
    unlockWithBiometric,
    unlocked,
  ]);

  if (!hydrated || !enabled || unlocked) {
    return null;
  }

  async function handleUnlock(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const ok = await unlockWithPassword(password);

      if (!ok) {
        setError(t("vault.wrongPassword"));
        return;
      }

      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  async function handleBiometric(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const ok = await authenticateWithBiometrics(
        t("vault.biometricPrompt"),
      );

      if (ok) {
        unlockWithBiometric();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="lock"
            size={28}
            color={colors.textSecondary}
          />
        </View>
        <Text style={styles.title}>
          {t("vault.unlockTitle")}
        </Text>
        <Text style={styles.subtitle}>
          {t("vault.unlockSubtitle")}
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          placeholder={t("vault.passwordPlaceholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onSubmitEditing={() => {
            void handleUnlock();
          }}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          disabled={busy || password.trim().length === 0}
          onPress={() => {
            void handleUnlock();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
            busy || password.trim().length === 0
              ? styles.disabled
              : null,
          ]}
        >
          {busy ? (
            <ActivityIndicator
              color={colors.background}
            />
          ) : (
            <Text style={styles.primaryButtonText}>
              {t("vault.unlock")}
            </Text>
          )}
        </Pressable>

        {biometricUnlockEnabled &&
        biometricAvailable ? (
          <Pressable
            disabled={busy}
            onPress={() => {
              void handleBiometric();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <MaterialIcons
              name="fingerprint"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={styles.secondaryButtonText}>
              {t("vault.useBiometric")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: colors.surfaceElevated,
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
  input: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
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
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryButtonText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});
