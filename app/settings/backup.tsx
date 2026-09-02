import { MaterialIcons } from "@expo/vector-icons";
import type * as DocumentPickerModule from "expo-document-picker";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { exportServerBackup } from "@/src/modules/backup/exportServerBackup";
import {
  applyServerBackup,
  decryptServerBackup,
} from "@/src/modules/backup/importServerBackup";
import type {
  ServerBackupImportMode,
  ServerBackupPayload,
} from "@/src/modules/backup/types/serverBackup";
import { readBackupFileText } from "@/src/modules/backup/utils/saveBackupFile";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";
import { useVaultStore } from "@/src/modules/vault/store/vault.store";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { Screen } from "@/src/shared/components/Screen";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type TabMode = "export" | "import";

/**
 * El selector de archivos es un módulo nativo: falta en builds
 * anteriores a v0.9.0, así que se carga de forma perezosa.
 */
function loadDocumentPicker():
  | typeof DocumentPickerModule
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-document-picker") as typeof DocumentPickerModule;
  } catch {
    return null;
  }
}

export default function BackupSettingsScreen() {
  const { t } = useTranslation();
  const servers = useServerStore(
    (state) => state.servers,
  );
  const plan = useSubscriptionStore(
    (state) => state.plan,
  );
  const sessionPassphrase = useVaultStore(
    (state) => state.sessionPassphrase,
  );
  const canBackup = canUseFeature(
    plan,
    "server-backup",
  );

  const [tab, setTab] = useState<TabMode>("export");
  const [selectedIds, setSelectedIds] = useState<
    string[]
  >([]);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [success, setSuccess] = useState<
    string | null
  >(null);
  const [showPremiumModal, setShowPremiumModal] =
    useState(false);

  const [importPayload, setImportPayload] =
    useState<ServerBackupPayload | null>(null);
  const [importIndexes, setImportIndexes] =
    useState<number[]>([]);
  const [duplicateMode, setDuplicateMode] =
    useState<ServerBackupImportMode>("skip");
  const [importAppSettings, setImportAppSettings] =
    useState(true);

  const allSelected = useMemo(
    () =>
      servers.length > 0 &&
      selectedIds.length === servers.length,
    [selectedIds.length, servers.length],
  );

  function requirePremium(): boolean {
    if (canBackup) {
      return true;
    }

    setShowPremiumModal(true);
    return false;
  }

  function toggleServer(serverId: string): void {
    setSelectedIds((current) =>
      current.includes(serverId)
        ? current.filter((id) => id !== serverId)
        : [...current, serverId],
    );
  }

  function toggleAll(): void {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(servers.map((server) => server.id));
  }

  function resolvePassphrase(): string {
    const typed = passphrase.trim();

    if (typed.length > 0) {
      return typed;
    }

    return sessionPassphrase?.trim() ?? "";
  }

  async function handleExport(): Promise<void> {
    if (!requirePremium()) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (selectedIds.length === 0) {
      setError(t("backup.selectServers"));
      return;
    }

    const secret = resolvePassphrase();

    if (secret.length < 6) {
      setError(t("backup.passphraseTooShort"));
      return;
    }

    setBusy(true);

    try {
      const saved = await exportServerBackup({
        serverIds: selectedIds,
        passphrase: secret,
      });
      setSuccess(
        t("backup.exportSaved", {
          filename: saved.filename,
        }),
      );
      setPassphrase("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("backup.exportFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePickImportFile(): Promise<void> {
    if (!requirePremium()) {
      return;
    }

    setError(null);
    setSuccess(null);

    const secret = resolvePassphrase();

    if (secret.length < 6) {
      setError(t("backup.passphraseTooShort"));
      return;
    }

    const DocumentPicker = loadDocumentPicker();

    if (!DocumentPicker) {
      setError(t("backup.pickerUnavailable"));
      return;
    }

    setBusy(true);

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "application/json",
            "application/octet-stream",
            "*/*",
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const text = await readBackupFileText(
        result.assets[0].uri,
      );
      const payload = await decryptServerBackup(
        text,
        secret,
      );

      setImportPayload(payload);
      setImportIndexes(
        payload.servers.map((_, index) => index),
      );
      setPassphrase("");
    } catch (err) {
      setImportPayload(null);
      setError(
        err instanceof Error
          ? err.message
          : t("backup.importFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleImportIndex(index: number): void {
    setImportIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  }

  async function handleApplyImport(): Promise<void> {
    if (!importPayload) {
      return;
    }

    if (!requirePremium()) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await applyServerBackup({
        payload: importPayload,
        selectedIndexes: importIndexes,
        duplicateMode,
        importAppSettings,
      });

      setSuccess(
        t("backup.importSuccess", {
          imported: result.imported,
          updated: result.updated,
          skipped: result.skipped,
        }),
      );
      setImportPayload(null);
      setImportIndexes([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("backup.importFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("backup.title"),
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
            {t("backup.title")}
          </Text>
          <Text style={styles.subtitle}>
            {canBackup
              ? t("backup.subtitle")
              : t("backup.subtitlePremium")}
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("export")}
            style={[
              styles.tab,
              tab === "export"
                ? styles.tabActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "export"
                  ? styles.tabTextActive
                  : null,
              ]}
            >
              {t("backup.exportTab")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("import")}
            style={[
              styles.tab,
              tab === "import"
                ? styles.tabActive
                : null,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "import"
                  ? styles.tabTextActive
                  : null,
              ]}
            >
              {t("backup.importTab")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("backup.passphrase")}
          </Text>
          <Text style={styles.cardHint}>
            {sessionPassphrase
              ? t("backup.passphraseSessionHint")
              : t("backup.passphraseHint")}
          </Text>
          <TextInput
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            placeholder={t(
              "backup.passphrasePlaceholder",
            )}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        {tab === "export" ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>
                {t("backup.servers")}
              </Text>
              <Pressable onPress={toggleAll}>
                <Text style={styles.link}>
                  {allSelected
                    ? t("backup.clearSelection")
                    : t("backup.selectAll")}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.cardHint}>
              {t("backup.exportIncludes")}
            </Text>

            {servers.length === 0 ? (
              <Text style={styles.empty}>
                {t("backup.noServers")}
              </Text>
            ) : (
              servers.map((server) => {
                const selected =
                  selectedIds.includes(server.id);

                return (
                  <Pressable
                    key={server.id}
                    onPress={() =>
                      toggleServer(server.id)
                    }
                    style={[
                      styles.serverRow,
                      selected
                        ? styles.serverRowSelected
                        : null,
                    ]}
                  >
                    <MaterialIcons
                      name={
                        selected
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={22}
                      color={
                        selected
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                    <View style={styles.serverInfo}>
                      <Text style={styles.serverName}>
                        {server.name}
                      </Text>
                      <Text style={styles.serverMeta}>
                        {server.url}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            <Pressable
              disabled={busy}
              onPress={() => {
                void handleExport();
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
                <>
                  {!canBackup ? (
                    <MaterialIcons
                      name="lock"
                      size={18}
                      color={colors.background}
                    />
                  ) : null}
                  <Text style={styles.primaryButtonText}>
                    {canBackup
                      ? t("backup.exportAction")
                      : t("backup.exportActionPremium")}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("backup.importTitle")}
            </Text>
            <Text style={styles.cardHint}>
              {t("backup.importHint")}
            </Text>

            <Pressable
              disabled={busy}
              onPress={() => {
                void handlePickImportFile();
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.pressed : null,
              ]}
            >
              {busy ? (
                <ActivityIndicator
                  color={colors.text}
                />
              ) : (
                <>
                  {!canBackup ? (
                    <MaterialIcons
                      name="lock"
                      size={18}
                      color={colors.text}
                    />
                  ) : null}
                  <Text style={styles.secondaryButtonText}>
                    {canBackup
                      ? t("backup.pickFile")
                      : t("backup.pickFilePremium")}
                  </Text>
                </>
              )}
            </Pressable>

            {importPayload ? (
              <>
                <Text style={styles.cardHint}>
                  {t("backup.importFound", {
                    count: importPayload.servers.length,
                  })}
                </Text>

                {importPayload.servers.map(
                  (server, index) => {
                    const selected =
                      importIndexes.includes(index);

                    return (
                      <Pressable
                        key={`${server.url}-${server.username}-${index}`}
                        onPress={() =>
                          toggleImportIndex(index)
                        }
                        style={[
                          styles.serverRow,
                          selected
                            ? styles.serverRowSelected
                            : null,
                        ]}
                      >
                        <MaterialIcons
                          name={
                            selected
                              ? "check-box"
                              : "check-box-outline-blank"
                          }
                          size={22}
                          color={
                            selected
                              ? colors.primary
                              : colors.textMuted
                          }
                        />
                        <View style={styles.serverInfo}>
                          <Text style={styles.serverName}>
                            {server.name}
                          </Text>
                          <Text style={styles.serverMeta}>
                            {server.url}
                            {server.favoriteMonitorIds
                              .length > 0
                              ? ` · ${t("backup.favoritesCount", { count: server.favoriteMonitorIds.length })}`
                              : ""}
                            {server.slaTarget !== null
                              ? ` · SLA ${(server.slaTarget * 100).toFixed(2)}%`
                              : ""}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  },
                )}

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.cardTitle}>
                      {t("backup.overwriteDuplicates")}
                    </Text>
                    <Text style={styles.cardHint}>
                      {t(
                        "backup.overwriteDuplicatesHint",
                      )}
                    </Text>
                  </View>
                  <Switch
                    value={duplicateMode === "overwrite"}
                    onValueChange={(value) =>
                      setDuplicateMode(
                        value ? "overwrite" : "skip",
                      )
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={
                      duplicateMode === "overwrite"
                        ? colors.primaryDark
                        : colors.textSecondary
                    }
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.cardTitle}>
                      {t("backup.importAppSettings")}
                    </Text>
                    <Text style={styles.cardHint}>
                      {t(
                        "backup.importAppSettingsHint",
                      )}
                    </Text>
                  </View>
                  <Switch
                    value={importAppSettings}
                    onValueChange={setImportAppSettings}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={
                      importAppSettings
                        ? colors.primary
                        : colors.textMuted
                    }
                  />
                </View>

                <Pressable
                  disabled={busy}
                  onPress={() => {
                    void handleApplyImport();
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
                      {t("backup.importAction")}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : null}
          </View>
        )}

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
        {success ? (
          <Text style={styles.success}>{success}</Text>
        ) : null}
      </Screen>

      <ConfirmModal
        visible={showPremiumModal}
        title={t("common.premiumFeature")}
        description={t("backup.premiumDescription")}
        confirmLabel={t("common.understood")}
        cancelLabel={null}
        onConfirm={() => setShowPremiumModal(false)}
        onCancel={() => setShowPremiumModal(false)}
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
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  cardHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  link: {
    ...typography.label,
    color: colors.primary,
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
  serverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  serverRowSelected: {
    borderColor: colors.primary,
  },
  serverInfo: {
    flex: 1,
    gap: 2,
  },
  serverName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  serverMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.bodyMedium,
    color: colors.background,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryButtonText: {
    ...typography.bodyMedium,
    color: colors.text,
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
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  success: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});
