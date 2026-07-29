/** Separador CSV orientado a Excel en español. */
export const CSV_SEPARATOR = ";";

/**
 * Normaliza el valor y lo escapa para CSV con `;`.
 * Conserva Ñ, acentos y el resto de Unicode (UTF-8 + BOM en el fichero).
 */
export function escapeCsvValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Evita notación científica rara y conserva enteros/decimales limpios.
  let text =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : String(value);

  // Quita controles C0 que rompen parsers; deja tab/LF/CR (irán entre comillas).
  text = text.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    "",
  );

  // NFC: Ñ y acentos compuestos quedan en forma canónica.
  text = text.normalize("NFC");

  const needsQuotes =
    text.includes('"') ||
    text.includes(CSV_SEPARATOR) ||
    text.includes("\n") ||
    text.includes("\r") ||
    /^\s|\s$/.test(text);

  if (needsQuotes) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function rowsToCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const lines = [
    headers.map(escapeCsvValue).join(CSV_SEPARATOR),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(CSV_SEPARATOR),
    ),
  ];

  // BOM UTF-8: Excel reconoce bien Ñ, acentos, etc.
  return `\uFEFF${lines.join("\n")}\n`;
}

export function slugifyFilenamePart(
  value: string,
): string {
  return (
    value
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "export"
  );
}

export function buildExportTimestamp(
  now = Date.now(),
): string {
  const date = new Date(now);
  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return `${date.getFullYear()}${pad(
    date.getMonth() + 1,
  )}${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(
    date.getSeconds(),
  )}`;
}
