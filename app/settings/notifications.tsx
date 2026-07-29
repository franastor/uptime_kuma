import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/src/notifications";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import { colors, spacing, typography } from "@/src/shared/theme";

export default function NotificationSettingsScreen() {
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const monitorsByServer = useMonitorStore(
    (state) => state.monitorsByServer,
  );
  const canFilterByTags = canUseFeature(
    plan,
    "advanced-filters",
  );

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();

    for (const monitors of Object.values(
      monitorsByServer,
    )) {
      for (const monitor of monitors) {
        for (const tag of monitor.tags) {
          const name = tag.name.trim();

          if (name) {
            tags.add(name);
          }
        }
      }
    }

    return [...tags].sort((left, right) =>
      left.localeCompare(right, "es"),
    );
  }, [monitorsByServer]);

  useEffect(() => {
    void loadNotificationPreferences()
      .then((stored) => {
        setPreferences(stored);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function updatePreference<
    Key extends keyof NotificationPreferences,
  >(
    key: Key,
    value: NotificationPreferences[Key],
  ): void {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleTagFilterToggle(
    enabled: boolean,
  ): void {
    if (enabled && !canFilterByTags) {
      Alert.alert(
        "Función Premium",
        "El filtrado por etiquetas estará disponible en Premium.",
      );
      return;
    }

    updatePreference("tagFilterEnabled", enabled);
  }

  function toggleTag(tagName: string): void {
    if (!canFilterByTags) {
      Alert.alert(
        "Función Premium",
        "El filtrado por etiquetas estará disponible en Premium.",
      );
      return;
    }

    setPreferences((current) => {
      const exists =
        current.selectedTags.includes(tagName);

      return {
        ...current,
        tagFilterEnabled: true,
        selectedTags: exists
          ? current.selectedTags.filter(
              (tag) => tag !== tagName,
            )
          : [...current.selectedTags, tagName],
      };
    });
  }

  async function handleSave(): Promise<void> {
    setSaving(true);

    try {
      const nextPreferences: NotificationPreferences =
        {
          ...preferences,
          tagFilterEnabled:
            preferences.tagFilterEnabled &&
            canFilterByTags,
          selectedTags: canFilterByTags
            ? preferences.selectedTags
            : [],
        };

      await saveNotificationPreferences(
        nextPreferences,
      );
      setPreferences(nextPreferences);
      router.back();
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "Revisa el almacenamiento e inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notificaciones",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <Text style={styles.intro}>
          Ajustes para avisos locales mientras la
          app está abierta. En segundo plano o
          cerrada todavía no llegan.
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>
            Cargando preferencias...
          </Text>
        ) : (
          <View style={styles.content}>
            <View style={styles.section}>
              <PreferenceSwitch
                title="Avisos activos"
                description="Generar notificaciones locales ante cambios UP/DOWN."
                value={preferences.enabled}
                onValueChange={(value) =>
                  updatePreference("enabled", value)
                }
              />
              <PreferenceSwitch
                title="Sonido"
                description="Reproducir sonido al mostrar el aviso."
                value={preferences.sound}
                disabled={!preferences.enabled}
                onValueChange={(value) =>
                  updatePreference("sound", value)
                }
              />
              <PreferenceSwitch
                title="Vibración"
                description="Vibrar al generar un aviso en primer plano."
                value={preferences.vibration}
                disabled={!preferences.enabled}
                onValueChange={(value) =>
                  updatePreference(
                    "vibration",
                    value,
                  )
                }
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Filtrado por etiquetas
                </Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>
                    PREMIUM
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Limita los avisos a monitores con
                etiquetas concretas.
              </Text>

              <PreferenceSwitch
                title="Activar filtro"
                description={
                  canFilterByTags
                    ? "Solo avisar monitores con las etiquetas seleccionadas."
                    : "Disponible en el plan Premium."
                }
                value={
                  preferences.tagFilterEnabled &&
                  canFilterByTags
                }
                disabled={!preferences.enabled}
                onValueChange={handleTagFilterToggle}
              />

              {availableTags.length > 0 ? (
                <View style={styles.tagList}>
                  {availableTags.map((tag) => {
                    const selected =
                      preferences.selectedTags.includes(
                        tag,
                      );

                    return (
                      <Pressable
                        key={tag}
                        disabled={
                          !preferences.enabled
                        }
                        onPress={() =>
                          toggleTag(tag)
                        }
                        style={[
                          styles.tagChip,
                          selected
                            ? styles.tagChipSelected
                            : null,
                          !preferences.enabled
                            ? styles.tagChipDisabled
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagChipText,
                            selected
                              ? styles.tagChipTextSelected
                              : null,
                          ]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyTags}>
                  Conéctate a un servidor para ver
                  etiquetas disponibles.
                </Text>
              )}
            </View>

            <AppButton
              title="Guardar ajustes"
              loading={saving}
              onPress={() => {
                void handleSave();
              }}
            />

            <Pressable
              disabled={saving}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed
                  ? styles.cancelButtonPressed
                  : null,
                saving
                  ? styles.cancelButtonDisabled
                  : null,
              ]}
            >
              <Text style={styles.cancelButtonText}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        )}
      </Screen>
    </>
  );
}

type PreferenceSwitchProps = {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

function PreferenceSwitch({
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: PreferenceSwitchProps) {
  return (
    <View
      style={[
        styles.switchCard,
        disabled ? styles.switchCardDisabled : null,
      ]}
    >
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>
          {title}
        </Text>
        <Text style={styles.switchDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.border,
          true: colors.primaryDark,
        }}
        thumbColor={
          value
            ? colors.primary
            : colors.textSecondary
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  content: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 20,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  planBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  planBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "800",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  switchCardDisabled: {
    opacity: 0.55,
  },
  switchText: {
    flex: 1,
    gap: spacing.xs,
  },
  switchTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  switchDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  tagChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  tagChipDisabled: {
    opacity: 0.5,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  tagChipTextSelected: {
    color: colors.primary,
  },
  emptyTags: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cancelButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonPressed: {
    opacity: 0.75,
  },
  cancelButtonDisabled: {
    opacity: 0.55,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text,
  },
});
