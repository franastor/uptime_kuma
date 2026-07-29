const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Uptime Kuma envía las marcas de tiempo en UTC con formato
 * "YYYY-MM-DD HH:mm:ss", que Hermes no parsea. Hay que convertirlas a ISO
 * y marcarlas como UTC de forma explícita.
 */
export function parseKumaTimestamp(
  value: string | null | undefined,
): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoLike = trimmed.replace(" ", "T");
  const normalized = HAS_TIMEZONE.test(isoLike)
    ? isoLike
    : `${isoLike}Z`;

  const timestamp = Date.parse(normalized);

  if (Number.isFinite(timestamp)) {
    return timestamp;
  }

  const fallback = Date.parse(trimmed);

  return Number.isFinite(fallback)
    ? fallback
    : null;
}
