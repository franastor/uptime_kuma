import { File } from "expo-file-system";

import {
  ExportUnavailableError,
  savePublicTextFile,
  type SavedPublicFile,
} from "@/src/modules/export/utils/savePublicFile";
import {
  buildExportTimestamp,
  slugifyFilenamePart,
} from "@/src/modules/export/utils/csv";
import type { EncryptedBlob } from "@/src/modules/vault/utils/crypto";

export type SavedBackupFile = SavedPublicFile;

export async function saveEncryptedBackupFile(input: {
  contents: EncryptedBlob;
  label?: string;
}): Promise<SavedBackupFile> {
  const stamp = buildExportTimestamp();
  const label = slugifyFilenamePart(
    input.label ?? "servers",
  );
  const filename = `kumapulse-backup-${label}-${stamp}.kpb`;

  return savePublicTextFile({
    filename,
    contents: JSON.stringify(input.contents),
    mimeType: "application/octet-stream",
  });
}

export async function readBackupFileText(
  uri: string,
): Promise<string> {
  try {
    const file = new File(uri);
    return await file.text();
  } catch {
    throw new ExportUnavailableError(
      "No se pudo leer el archivo de backup",
    );
  }
}
