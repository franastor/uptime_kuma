import { Directory, File, Paths } from "expo-file-system";

export class ExportUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportUnavailableError";
  }
}

export type SavedCsvFile = {
  filename: string;
  uri: string;
};

/**
 * Guarda el CSV en Documentos de la app (carpeta exports),
 * sin abrir el sheet de compartir.
 */
export function saveCsvFile(input: {
  filename: string;
  contents: string;
}): SavedCsvFile {
  const safeName = input.filename.replace(
    /[^\w.\-]+/g,
    "_",
  );

  const exportsDir = new Directory(
    Paths.document,
    "exports",
  );

  if (!exportsDir.exists) {
    exportsDir.create({ intermediates: true });
  }

  const file = new File(exportsDir, safeName);
  file.create({ overwrite: true });
  file.write(input.contents);

  return {
    filename: safeName,
    uri: file.uri,
  };
}
