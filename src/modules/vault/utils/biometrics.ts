import type * as LocalAuthenticationModule from "expo-local-authentication";

export type BiometricAvailability = {
  hardware: boolean;
  enrolled: boolean;
  available: boolean;
};

const UNAVAILABLE: BiometricAvailability = {
  hardware: false,
  enrolled: false,
  available: false,
};

/**
 * El módulo nativo no existe en builds anteriores a v0.9.0
 * ni en Expo Go, así que se carga de forma perezosa.
 */
function loadModule():
  | typeof LocalAuthenticationModule
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-local-authentication") as typeof LocalAuthenticationModule;
  } catch {
    return null;
  }
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const LocalAuthentication = loadModule();

  if (!LocalAuthentication) {
    return UNAVAILABLE;
  }

  try {
    const [hardware, enrolled] =
      await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

    return {
      hardware,
      enrolled,
      available: hardware && enrolled,
    };
  } catch {
    return UNAVAILABLE;
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  const LocalAuthentication = loadModule();

  if (!LocalAuthentication) {
    return false;
  }

  try {
    const result =
      await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

    return result.success;
  } catch {
    return false;
  }
}
