import { create } from "zustand";

import {
  clearVaultVerifier,
  loadVaultVerifier,
  saveVaultVerifier,
} from "@/src/modules/vault/storage/vaultStorage";
import {
  createPasswordVerifier,
  verifyPassword,
} from "@/src/modules/vault/utils/crypto";

type VaultState = {
  hydrated: boolean;
  enabled: boolean;
  unlocked: boolean;
  /** Solo en memoria tras unlock con pass; la biometría no la rellena. */
  sessionPassphrase: string | null;
  lastBackgroundAt: number | null;
  hydrate: () => Promise<void>;
  enableVault: (password: string) => Promise<void>;
  disableVault: (password: string) => Promise<void>;
  unlockWithPassword: (
    password: string,
  ) => Promise<boolean>;
  unlockWithBiometric: () => void;
  lock: () => void;
  markBackground: () => void;
  maybeLockFromTimeout: (
    timeoutMinutes: number,
  ) => void;
};

export const useVaultStore = create<VaultState>(
  (set, get) => ({
    hydrated: false,
    enabled: false,
    unlocked: true,
    sessionPassphrase: null,
    lastBackgroundAt: null,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      const verifier = await loadVaultVerifier();
      const enabled = verifier !== null;

      set({
        hydrated: true,
        enabled,
        unlocked: !enabled,
        sessionPassphrase: null,
        lastBackgroundAt: null,
      });
    },

    enableVault: async (password) => {
      const trimmed = password.trim();

      if (trimmed.length < 6) {
        throw new Error(
          "La contraseña debe tener al menos 6 caracteres",
        );
      }

      const verifier =
        await createPasswordVerifier(trimmed);
      await saveVaultVerifier(verifier);

      set({
        enabled: true,
        unlocked: true,
        sessionPassphrase: trimmed,
      });
    },

    disableVault: async (password) => {
      const verifier = await loadVaultVerifier();

      if (!verifier) {
        set({
          enabled: false,
          unlocked: true,
          sessionPassphrase: null,
        });
        return;
      }

      const ok = await verifyPassword(
        password,
        verifier,
      );

      if (!ok) {
        throw new Error(
          "Contraseña incorrecta",
        );
      }

      await clearVaultVerifier();
      set({
        enabled: false,
        unlocked: true,
        sessionPassphrase: null,
      });
    },

    unlockWithPassword: async (password) => {
      const verifier = await loadVaultVerifier();

      if (!verifier) {
        set({
          enabled: false,
          unlocked: true,
          sessionPassphrase: null,
        });
        return true;
      }

      const ok = await verifyPassword(
        password,
        verifier,
      );

      if (!ok) {
        return false;
      }

      set({
        unlocked: true,
        sessionPassphrase: password,
        lastBackgroundAt: null,
      });
      return true;
    },

    unlockWithBiometric: () => {
      if (!get().enabled) {
        return;
      }

      set({
        unlocked: true,
        lastBackgroundAt: null,
      });
    },

    lock: () => {
      if (!get().enabled) {
        return;
      }

      set({
        unlocked: false,
        sessionPassphrase: null,
        lastBackgroundAt: null,
      });
    },

    markBackground: () => {
      if (!get().enabled || !get().unlocked) {
        return;
      }

      set({ lastBackgroundAt: Date.now() });
    },

    maybeLockFromTimeout: (timeoutMinutes) => {
      const {
        enabled,
        unlocked,
        lastBackgroundAt,
      } = get();

      if (
        !enabled ||
        !unlocked ||
        lastBackgroundAt === null
      ) {
        return;
      }

      if (timeoutMinutes <= 0) {
        set({
          unlocked: false,
          sessionPassphrase: null,
          lastBackgroundAt: null,
        });
        return;
      }

      const elapsedMs =
        Date.now() - lastBackgroundAt;
      const limitMs =
        timeoutMinutes * 60 * 1000;

      if (elapsedMs >= limitMs) {
        set({
          unlocked: false,
          sessionPassphrase: null,
          lastBackgroundAt: null,
        });
      }
    },
  }),
);
