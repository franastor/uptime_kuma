import * as SecureStore from "expo-secure-store";

import type { PasswordVerifier } from "@/src/modules/vault/utils/crypto";

const VAULT_VERIFIER_KEY = "kumapulse.vault.verifier.v1";

function isPasswordVerifier(
  value: unknown,
): value is PasswordVerifier {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return (
    typeof candidate.salt === "string" &&
    typeof candidate.hash === "string" &&
    typeof candidate.iterations === "number" &&
    candidate.iterations > 0
  );
}

export async function loadVaultVerifier(): Promise<PasswordVerifier | null> {
  try {
    const stored =
      await SecureStore.getItemAsync(
        VAULT_VERIFIER_KEY,
      );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(
      stored,
    ) as unknown;

    if (!isPasswordVerifier(parsed)) {
      await SecureStore.deleteItemAsync(
        VAULT_VERIFIER_KEY,
      );
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveVaultVerifier(
  verifier: PasswordVerifier,
): Promise<void> {
  await SecureStore.setItemAsync(
    VAULT_VERIFIER_KEY,
    JSON.stringify(verifier),
  );
}

export async function clearVaultVerifier(): Promise<void> {
  await SecureStore.deleteItemAsync(
    VAULT_VERIFIER_KEY,
  );
}
