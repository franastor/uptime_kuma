import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useAccountStore } from "@/src/modules/account/store/account.store";
import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";

import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/src/notifications";
import { notificationService } from "@/src/notifications/NotificationService";
import {
  PUSH_BACKEND_URL,
  registerPushToken,
} from "@/src/notifications/PushRegistration";
import { AppButton } from "@/src/shared/components/AppButton";
import { Screen } from "@/src/shared/components/Screen";
import { colors, spacing, typography } from "@/src/shared/theme";

export default function NotificationSettingsScreen() {
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const session = useAccountStore(
    (state) => state.session,
  );
  const activeServerId = useServerStore(
    (state) => state.activeServerId,
  );
  const servers = useServerStore(
    (state) => state.servers,
  );

  const activeServer = servers.find(
    (s) => s.id === activeServerId,
  ) ?? servers[0];
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
  const [pushPermission, setPushPermission] =
    useState<"granted" | "denied" | "undetermined">(
      "undetermined",
    );

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

  useEffect(() => {
    void notificationService
      .getPermissionState()
      .then(setPushPermission)
      .catch(() => setPushPermission("denied"));
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

  async function openSystemSettings(): Promise<void> {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible en el navegador",
        "Los permisos de notificación se gestionan desde la app móvil.",
      );
      return;
    }
    void Linking.openSettings();
  }

  async function handleEnablePush(): Promise<void> {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible en el navegador",
        "Activa los avisos push desde la app móvil de KumaPulse.",
      );
      return;
    }
    const granted =
      await notificationService.requestPermissions();
    const state =
      await notificationService.getPermissionState();
    setPushPermission(state);
    if (granted) {
      void registerPushToken();
    }
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
          Avisos locales en primer plano y push
          remoto con la app cerrada (UP/DOWN),
          con deduplicación y filtros.
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>
            Cargando preferencias...
          </Text>
        ) : (
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Notificaciones push
              </Text>
              <Text style={styles.sectionDescription}>
                {pushPermission === "granted"
                  ? "Activadas: recibirás avisos de tus monitores con la app cerrada."
                  : "Actívalas para recibir avisos de tus monitores con la app cerrada."}
              </Text>
              {pushPermission === "granted" ? (
                <AppButton
                  title="Ajustes del sistema (desactivar)"
                  onPress={() => {
                    void openSystemSettings();
                  }}
                />
              ) : pushPermission === "denied" ? (
                <AppButton
                  title="Permiso denegado — abrir ajustes"
                  onPress={() => {
                    void openSystemSettings();
                  }}
                />
              ) : (
                <AppButton
                  title="Activar notificaciones push"
                  onPress={() => {
                    void handleEnablePush();
                  }}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Configurar en tu Uptime Kuma
              </Text>
              <Text style={styles.sectionDescription}>
                Para recibir avisos con la app cerrada, tu
                instancia de Uptime Kuma debe enviar los
                cambios de estado a KumaPulse:
              </Text>

              {!session ? (
                <View style={styles.guideBox}>
                  <Text style={styles.guideText}>
                    1. Crea una cuenta desde Ajustes →
                    “Cuenta y push”.\n\n2. Vuelve aquí y sigue
                    los pasos.
                  </Text>
                  <AppButton
                    title="Crear cuenta / iniciar sesión"
                    onPress={() =>
                      router.push(
                        "/settings/account",
                      )
                    }
                  />
                </View>
              ) : activeServer ? (
                <View style={styles.guideBox}>
                  <Text style={styles.guideText}>
                    1. En Uptime Kuma: Ajustes →
                    Notificaciones → “Añadir
                    notificación” → tipo Webhook.\n\n2.
                    Pon esta URL:\n{" "}
                  </Text>
                  <Text
                    style={styles.guideUrl}
                    selectable
                  >
                    {`${PUSH_BACKEND_URL}/api/webhook/${activeServer.id}`}
                  </Text>
                  <Text style={styles.guideText}>
                    \n3. Añade esta cabecera (Custom
                    Headers):\n{" "}
                  </Text>
                  <Text
                    style={styles.guideUrl}
                    selectable
                  >
                    {`X-Api-Key: ${session.webhookKey}`}
                  </Text>
                  <Text style={styles.guideText}>
                    \n4. Activa los estados “Up” y “Down”
                    y guarda.\n\nAñade esa notificación a
                    los monitores que quieras vigilar.
                  </Text>
                </View>
              ) : (
                <View style={styles.guideBox}>
                  <Text style={styles.guideText}>
                    Añade primero un servidor en la
                    pantalla principal para generar tu URL
                    de webhook.
                  </Text>
                </View>
              )}
            </View>

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
                    Premium
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
          true: colors.primary,
        }}
        thumbColor={
          value
            ? colors.primaryDark
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
  guideBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  guideText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  guideUrl: {
    ...typography.mono,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
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
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  tagChipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  tagChipDisabled: {
    opacity: 0.5,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagChipTextSelected: {
    color: colors.background,
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
    borderRadius: 8,
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
