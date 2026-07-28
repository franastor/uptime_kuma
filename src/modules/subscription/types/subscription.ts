export type SubscriptionPlan = "free" | "premium";

export type PremiumFeature =
  | "advanced-dashboard"
  | "advanced-filters"
  | "favorites"
  | "incident-center"
  | "push-notifications"
  | "mobile-widgets"
  | "unlimited-servers"
  | "custom-themes"
  | "data-export";

export interface SubscriptionState {
  plan: SubscriptionPlan;
  hydrated: boolean;
  setPlan: (plan: SubscriptionPlan) => void;
  hydrate: () => Promise<void>;
}
