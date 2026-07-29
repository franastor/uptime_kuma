import {
  savePublicTextFile,
  type SavedPublicFile,
} from "@/src/modules/export/utils/savePublicFile";

export type { SavedPublicFile as SavedCsvFile };

/**
 * Guarda el CSV en Descargas (Android) o Documentos/exports (iOS).
 */
export async function saveCsvFile(input: {
  filename: string;
  contents: string;
}): Promise<SavedPublicFile> {
  return savePublicTextFile({
    filename: input.filename,
    contents: input.contents,
    mimeType: "text/csv",
  });
}
