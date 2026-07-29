/**
 * Percentil simple sobre una lista de números (p en 0–100).
 */
export function percentile(
  values: number[],
  p: number,
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort(
    (left, right) => left - right,
  );
  const rank =
    (Math.min(100, Math.max(0, p)) / 100) *
    (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = rank - lower;

  return (
    sorted[lower] * (1 - weight) +
    sorted[upper] * weight
  );
}

export function maxNumber(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

export function averageNumber(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}
