import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SslCertificateItem } from "@/src/modules/analytics/types/analytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type SslCertificatesListProps = {
  certificates: SslCertificateItem[];
  onPressMonitor?: (
    certificate: SslCertificateItem,
  ) => void;
};

export function SslCertificatesList({
  certificates,
  onPressMonitor,
}: SslCertificatesListProps) {
  if (certificates.length === 0) {
    return (
      <Text style={styles.empty}>
        Sin datos de certificados SSL para este
        servidor.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {certificates.slice(0, 8).map((item) => {
        const urgent =
          item.valid === false ||
          (item.daysRemaining != null &&
            item.daysRemaining <= 14);
        const color =
          item.valid === false
            ? colors.danger
            : urgent
              ? colors.warning
              : colors.success;

        return (
          <Pressable
            key={`${item.serverId}:${item.monitorId}`}
            accessibilityRole="button"
            disabled={!onPressMonitor}
            onPress={() =>
              onPressMonitor?.(item)
            }
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
          >
            <MaterialIcons
              name="verified-user"
              size={20}
              color={color}
            />
            <View style={styles.info}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {item.monitorName}
              </Text>
              <Text style={styles.meta}>
                {item.valid === false
                  ? "No válido"
                  : item.daysRemaining == null
                    ? "Sin caducidad conocida"
                    : `${Math.round(
                        item.daysRemaining,
                      )} días restantes`}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
