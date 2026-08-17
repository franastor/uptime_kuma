import type { AnalyticsSummary } from "@/src/modules/analytics/types/analytics";
import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import {
  buildAnalyticsExcel,
  buildAnalyticsExcelFilename,
  buildTimelineExcel,
  buildTimelineExcelFilename,
} from "@/src/modules/export/utils/buildExcel";
import {
  savePublicBase64File,
  type SavedPublicFile,
} from "@/src/modules/export/utils/savePublicFile";
import type { ResolvedLocale } from "@/src/shared/i18n";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportTimelineExcel(input: {
  events: TimelineEvent[];
  serverName: string;
  monitorName?: string | null;
  locale: ResolvedLocale;
}): Promise<SavedPublicFile> {
  if (input.events.length === 0) {
    throw new Error(
      input.locale === "es"
        ? "No hay eventos para exportar con el filtro actual."
        : "There are no events to export with the current filter.",
    );
  }

  return savePublicBase64File({
    filename: buildTimelineExcelFilename(input),
    base64: buildTimelineExcel(input),
    mimeType: XLSX_MIME,
  });
}

export async function exportAnalyticsExcel(input: {
  summary: AnalyticsSummary;
  serverName: string;
  locale: ResolvedLocale;
}): Promise<SavedPublicFile> {
  if (input.summary.monitors.length === 0) {
    throw new Error(
      input.locale === "es"
        ? "No hay monitores para exportar en esta ventana."
        : "There are no monitors to export in this window.",
    );
  }

  return savePublicBase64File({
    filename: buildAnalyticsExcelFilename({
      serverName: input.serverName,
      window: input.summary.window,
    }),
    base64: buildAnalyticsExcel(input),
    mimeType: XLSX_MIME,
  });
}
