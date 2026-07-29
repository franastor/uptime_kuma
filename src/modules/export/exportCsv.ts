import type { AnalyticsSummary } from "@/src/modules/analytics/types/analytics";
import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import {
  buildAnalyticsCsv,
  buildAnalyticsExportFilename,
} from "@/src/modules/export/utils/buildAnalyticsCsv";
import {
  buildTimelineCsv,
  buildTimelineExportFilename,
} from "@/src/modules/export/utils/buildTimelineCsv";
import {
  type SavedCsvFile,
  saveCsvFile,
} from "@/src/modules/export/utils/saveCsvFile";

export async function exportTimelineCsv(input: {
  events: TimelineEvent[];
  serverName: string;
  monitorName?: string | null;
}): Promise<SavedCsvFile> {
  if (input.events.length === 0) {
    throw new Error(
      "No hay eventos para exportar con el filtro actual.",
    );
  }

  const filename = buildTimelineExportFilename({
    serverName: input.serverName,
    monitorName: input.monitorName,
  });

  return saveCsvFile({
    filename,
    contents: buildTimelineCsv(input.events),
  });
}

export async function exportAnalyticsCsv(input: {
  summary: AnalyticsSummary;
  serverName: string;
}): Promise<SavedCsvFile> {
  if (input.summary.monitors.length === 0) {
    throw new Error(
      "No hay monitores para exportar en esta ventana.",
    );
  }

  const filename = buildAnalyticsExportFilename({
    serverName: input.serverName,
    window: input.summary.window,
  });

  return saveCsvFile({
    filename,
    contents: buildAnalyticsCsv(input.summary),
  });
}
