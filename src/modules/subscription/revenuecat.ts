import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

// RevenueCat — suscripciones Premium (Google Play / App Store).
// Las claves van en EAS como EXPO_PUBLIC_* (ver .env.example).
// Si no hay claves configuradas, la app sigue con el plan local
// (free/premium por defecto) y estas funciones son no-op.
const RC_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const RC_IOS_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

export const REVENUECAT_ENTITLEMENT = "premium";

let configured = false;

export function isRevenueCatConfigured(): boolean {
  return Boolean(
    (Platform.OS === "android" && RC_ANDROID_KEY) ||
      (Platform.OS === "ios" && RC_IOS_KEY),
  );
}

/**
 * Configura RevenueCat una sola vez. No-op si no hay claves.
 */
export async function configureRevenueCat(): Promise<boolean> {
  if (configured) {
    return true;
  }

  const apiKey =
    Platform.OS === "android"
      ? RC_ANDROID_KEY
      : RC_IOS_KEY;

  if (!apiKey) {
    return false;
  }

  await Purchases.configure({
    apiKey,
  });
  configured = true;
  return true;
}

function hasPremium(customerInfo: CustomerInfo): boolean {
  return Boolean(
    customerInfo.entitlements.active[
      REVENUECAT_ENTITLEMENT
    ],
  );
}

/**
 * Devuelve "premium" | "free" según los entitlements activos.
 */
export async function getRevenueCatPlan(): Promise<
  "premium" | "free"
> {
  if (!(await configureRevenueCat())) {
    return "free";
  }

  const customerInfo =
    await Purchases.getCustomerInfo();
  return hasPremium(customerInfo)
    ? "premium"
    : "free";
}

/**
 * Obtiene el paquete (producto) a comprar. Devuelve null si no
 * hay ofertas o RevenueCat no está configurado.
 */
export async function getPremiumPackage(): Promise<PurchasesPackage | null> {
  if (!(await configureRevenueCat())) {
    return null;
  }

  try {
    const offerings =
      await Purchases.getOfferings();
    return (
      offerings.current?.availablePackages[0] ??
      offerings.all
        ? Object.values(offerings.all)[0]
            ?.availablePackages[0] ?? null
        : null
    );
  } catch {
    return null;
  }
}

/**
 * Compra el paquete premium. Devuelve el plan resultante.
 */
export async function purchasePremium(): Promise<
  "premium" | "free"
> {
  const pkg = await getPremiumPackage();

  if (!pkg) {
    throw new Error(
      "No hay productos de suscripción disponibles. Revisa la configuración de RevenueCat.",
    );
  }

  const result =
    await Purchases.purchasePackage(pkg);
  return hasPremium(
    result.customerInfo,
  )
    ? "premium"
    : "free";
}

/**
 * Restaura compras previas. Devuelve el plan resultante.
 */
export async function restoreRevenueCatPurchases(): Promise<
  "premium" | "free"
> {
  if (!(await configureRevenueCat())) {
    return "free";
  }

  const customerInfo =
    await Purchases.restorePurchases();
  return hasPremium(customerInfo)
    ? "premium"
    : "free";
}

/**
 * Escucha cambios de entitlement (p.ej. renovación, cancelación)
 * y devuelve una función para cancelar la suscripción al listener.
 */
export function subscribeToRevenueCat(
  onChange: (plan: "premium" | "free") => void,
): () => void {
  if (!isRevenueCatConfigured()) {
    return () => {};
  }

  const listener = (
    customerInfo: CustomerInfo,
  ) => {
    onChange(
      hasPremium(customerInfo)
        ? "premium"
        : "free",
    );
  };

  Purchases.addCustomerInfoUpdateListener(
    listener,
  );

  return () => {
    Purchases.removeCustomerInfoUpdateListener(
      listener,
    );
  };
}
