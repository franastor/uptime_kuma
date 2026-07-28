import {
  FREE_SERVER_LIMIT,
  PLAN_FEATURES,
} from "@/src/modules/subscription/config/subscription.config";

import type {
  PremiumFeature,
  SubscriptionPlan,
} from "@/src/modules/subscription/types/subscription";

export function canUseFeature(
  plan: SubscriptionPlan,
  feature: PremiumFeature,
): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

export function canAddServer(
  plan: SubscriptionPlan,
  currentServerCount: number,
): boolean {
  return (
    canUseFeature(plan, "unlimited-servers") ||
    currentServerCount < FREE_SERVER_LIMIT
  );
}
