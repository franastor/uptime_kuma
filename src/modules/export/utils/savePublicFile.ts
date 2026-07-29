import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EncodingType,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export class ExportUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportUnavailableError";
  }
}

export type SavedPublicFile = {
  filename: string;
  uri: string;
  /** Android: carpeta pública elegida (idealmente Descargas). iOS: Documentos de la app. */
  location: "downloads" | "documents";
};

const SAF_DIR_KEY = "kumapulse.exports.safDirectoryUri";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-]+/g, "_");
}

async function getCachedSafDirectoryUri(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(SAF_DIR_KEY);

    if (!stored) {
      return null;
    }

    // Comprueba que el permiso sigue válido.
    await StorageAccessFramework.readDirectoryAsync(
      stored,
    );
    return stored;
  } catch {
    await AsyncStorage.removeItem(SAF_DIR_KEY);
    return null;
  }
}

async function requestSafDirectoryUri(): Promise<string> {
  const initialUri =
    StorageAccessFramework.getUriForDirectoryInRoot(
      "Download",
    );

  const permissions =
    await StorageAccessFramework.requestDirectoryPermissionsAsync(
      initialUri,
    );

  if (!permissions.granted || !permissions.directoryUri) {
    throw new ExportUnavailableError(
      "Necesitas elegir la carpeta Descargas para guardar el archivo",
    );
  }

  await AsyncStorage.setItem(
    SAF_DIR_KEY,
    permissions.directoryUri,
  );

  return permissions.directoryUri;
}

async function saveWithSaf(input: {
  filename: string;
  contents: string;
  mimeType: string;
}): Promise<SavedPublicFile> {
  const filename = sanitizeFilename(input.filename);
  let directoryUri = await getCachedSafDirectoryUri();

  if (!directoryUri) {
    directoryUri = await requestSafDirectoryUri();
  }

  try {
    const fileUri =
      await StorageAccessFramework.createFileAsync(
        directoryUri,
        filename,
        input.mimeType,
      );

    await writeAsStringAsync(fileUri, input.contents, {
      encoding: EncodingType.UTF8,
    });

    return {
      filename,
      uri: fileUri,
      location: "downloads",
    };
  } catch (error) {
    // Permiso caducado o carpeta inválida: pedir de nuevo una vez.
    await AsyncStorage.removeItem(SAF_DIR_KEY);
    directoryUri = await requestSafDirectoryUri();

    try {
      const fileUri =
        await StorageAccessFramework.createFileAsync(
          directoryUri,
          filename,
          input.mimeType,
        );

      await writeAsStringAsync(fileUri, input.contents, {
        encoding: EncodingType.UTF8,
      });

      return {
        filename,
        uri: fileUri,
        location: "downloads",
      };
    } catch {
      throw new ExportUnavailableError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el archivo en Descargas",
      );
    }
  }
}

function saveToAppDocuments(input: {
  filename: string;
  contents: string;
}): SavedPublicFile {
  const filename = sanitizeFilename(input.filename);
  const exportsDir = new Directory(
    Paths.document,
    "exports",
  );

  if (!exportsDir.exists) {
    exportsDir.create({ intermediates: true });
  }

  const file = new File(exportsDir, filename);
  file.create({ overwrite: true });
  file.write(input.contents);

  return {
    filename,
    uri: file.uri,
    location: "documents",
  };
}

/**
 * Android: guarda en una carpeta pública vía SAF (la primera vez
 * pide elegir Descargas y recuerda la URI).
 * iOS: Documents/exports de la app (sin Downloads público).
 */
export async function savePublicTextFile(input: {
  filename: string;
  contents: string;
  mimeType: string;
}): Promise<SavedPublicFile> {
  if (Platform.OS === "android") {
    return saveWithSaf(input);
  }

  try {
    return saveToAppDocuments(input);
  } catch {
    throw new ExportUnavailableError(
      "No se pudo guardar el archivo en el dispositivo",
    );
  }
}
