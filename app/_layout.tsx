import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { colors } from "@/src/shared/theme";

export default function RootLayout() {
  const hydrateSubscription =
    useSubscriptionStore(
      (state) => state.hydrate,
    );

  useEffect(() => {
    void hydrateSubscription();
  }, [hydrateSubscription]);

  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "fade",
        }}
      />
    </>
  );
}
