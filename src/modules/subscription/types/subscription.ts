export type SubscriptionPlan = "free" | "premium";

export type PremiumFeature =
  | "advanced-dashboard"
  | "advanced-filters"
  | "favorites"
  | "incident-center"
  | "push-notifications"
  | "mobile-widgets"
  | "unlimited-servers"
  | "unlimited-monitors"
  | "custom-themes"
  | "data-export"
  | "server-backup";

export interface SubscriptionState {
  plan: SubscriptionPlan;
  hydrated: boolean;
  setPlan: (plan: SubscriptionPlan) => void;
  hydrate: () => Promise<void>;
}
