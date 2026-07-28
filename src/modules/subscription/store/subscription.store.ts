import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type {
  SubscriptionPlan,
  SubscriptionState,
} from "@/src/modules/subscription/types/subscription";

const STORAGE_KEY = "kuma.subscription.plan";
const DEFAULT_PLAN: SubscriptionPlan = "free";

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
        const storedPlan = await AsyncStorage.getItem(
          STORAGE_KEY,
        );

        set({
          plan: isSubscriptionPlan(storedPlan)
            ? storedPlan
            : DEFAULT_PLAN,
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
