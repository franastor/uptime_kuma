import {
  FREE_FAVORITE_LIMIT,
  FREE_MONITOR_LIMIT,
  FREE_SERVER_LIMIT,
  PLAN_FEATURES,
} from "@/src/modules/subscription/config/subscription.config";

import type {
  PremiumFeature,
  SubscriptionPlan,
} from "@/src/modules/subscription/types/subscription";
import type { Monitor } from "@/src/modules/monitor/types/monitor";

export {
  FREE_FAVORITE_LIMIT,
  FREE_MONITOR_LIMIT,
  FREE_SERVER_LIMIT,
};

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

export function canAddFavorite(
  plan: SubscriptionPlan,
  currentFavoriteCount: number,
): boolean {
  return (
    canUseFeature(plan, "favorites") ||
    currentFavoriteCount < FREE_FAVORITE_LIMIT
  );
}

export function getMonitorLimit(
  plan: SubscriptionPlan,
): number | null {
  return canUseFeature(plan, "unlimited-monitors")
    ? null
    : FREE_MONITOR_LIMIT;
}

/**
 * En Free se quedan como máximo 10 monitores, por orden alfabético.
 */
export function limitMonitorsForPlan(
  monitors: Monitor[],
  plan: SubscriptionPlan,
  _favoriteIds: number[] = [],
): Monitor[] {
  const limit = getMonitorLimit(plan);

  if (limit === null || monitors.length <= limit) {
    return monitors;
  }

  return [...monitors]
    .sort((left, right) =>
      left.name.localeCompare(right.name, "es"),
    )
    .slice(0, limit);
}
