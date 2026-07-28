import type {
  PremiumFeature,
  SubscriptionPlan,
} from "@/src/modules/subscription/types/subscription";

export const FREE_SERVER_LIMIT = 1;
export const FREE_FAVORITE_LIMIT = 3;

export const PLAN_FEATURES: Record<
  SubscriptionPlan,
  ReadonlySet<PremiumFeature>
> = {
  free: new Set(),
  premium: new Set<PremiumFeature>([
    "advanced-dashboard",
    "advanced-filters",
    "favorites",
    "incident-center",
    "push-notifications",
    "mobile-widgets",
    "unlimited-servers",
    "custom-themes",
    "data-export",
  ]),
};
