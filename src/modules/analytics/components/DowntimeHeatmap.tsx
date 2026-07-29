import { StyleSheet, Text, View } from "react-native";

import type { HeatmapCell } from "@/src/modules/analytics/types/analytics";
import { WEEKDAY_LABELS } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type DowntimeHeatmapProps = {
  cells: HeatmapCell[];
};

function intensityColor(
  downtimeMs: number,
  maxDowntimeMs: number,
): string {
  if (downtimeMs <= 0 || maxDowntimeMs <= 0) {
    return colors.border;
  }

  const ratio = Math.min(
    1,
    downtimeMs / maxDowntimeMs,
  );

  if (ratio < 0.25) {
    return "#5A2A2A";
  }

  if (ratio < 0.5) {
    return "#8B3535";
  }

  if (ratio < 0.75) {
    return "#C44A4A";
  }

  return colors.danger;
}

export function DowntimeHeatmap({
  cells,
}: DowntimeHeatmapProps) {
  const maxDowntimeMs = cells.reduce(
    (max, cell) =>
      Math.max(max, cell.downtimeMs),
    0,
  );
  const hasData = maxDowntimeMs > 0;

  return (
    <View style={styles.container}>
      {!hasData ? (
        <Text style={styles.empty}>
          Sin caídas en esta ventana para dibujar
          el heatmap.
        </Text>
      ) : null}

      <View style={styles.grid}>
        {WEEKDAY_LABELS.map((label, day) => (
          <View key={label} style={styles.row}>
            <Text style={styles.dayLabel}>
              {label}
            </Text>
            <View style={styles.hours}>
              {Array.from(
                { length: 24 },
                (_, hour) => {
                  const cell = cells[day * 24 + hour];

                  return (
                    <View
                      key={`${day}-${hour}`}
                      accessible
                      accessibilityLabel={`${label} ${hour}:00, ${
                        cell?.incidents ?? 0
                      } incidencias`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor:
                            intensityColor(
                              cell?.downtimeMs ??
                                0,
                              maxDowntimeMs,
                            ),
                        },
                      ]}
                    />
                  );
                },
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Menos caídas
        </Text>
        <View style={styles.legendScale}>
          {[0, 0.2, 0.45, 0.7, 1].map(
            (ratio) => (
              <View
                key={ratio}
                style={[
                  styles.legendSwatch,
                  {
                    backgroundColor:
                      intensityColor(
                        ratio * Math.max(
                          maxDowntimeMs,
                          1,
                        ),
                        Math.max(
                          maxDowntimeMs,
                          1,
                        ),
                      ),
                  },
                ]}
              />
            ),
          )}
        </View>
        <Text style={styles.legendText}>
          Más caídas
        </Text>
      </View>

      <Text style={styles.hint}>
        Filas = día de la semana · columnas =
        hora local
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  grid: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dayLabel: {
    ...typography.caption,
    width: 14,
    color: colors.textMuted,
    fontWeight: "700",
    textAlign: "center",
  },
  hours: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 12,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  legendScale: {
    flexDirection: "row",
    gap: 3,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
