import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type {
  SubscriptionPlan,
  SubscriptionState,
} from "@/src/modules/subscription/types/subscription";

const STORAGE_KEY = "kuma.subscription.plan";
/** En desarrollo partimos de Premium para probar el Dashboard avanzado. */
const DEFAULT_PLAN: SubscriptionPlan = __DEV__
  ? "premium"
  : "free";

function isSubscriptionPlan(
  value: string | null,
): value is SubscriptionPlan {
  return value === "free" || value === "premium";
}

export const useSubscriptionStore =
  create<SubscriptionState>((set) => ({
    plan: DEFAULT_PLAN,
    hydrated: false,

    setPlan: (plan) => {
      set({ plan });
      void AsyncStorage.setItem(STORAGE_KEY, plan);
    },

    hydrate: async () => {
      try {
        const storedPlan =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (isSubscriptionPlan(storedPlan)) {
          set({
            plan: storedPlan,
            hydrated: true,
          });
          return;
        }

        // Primera carga en desarrollo: Premium por defecto.
        if (__DEV__) {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            "premium",
          );
        }

        set({
          plan: DEFAULT_PLAN,
          hydrated: true,
        });
      } catch {
        set({
          plan: DEFAULT_PLAN,
          hydrated: true,
        });
      }
    },
  }));
