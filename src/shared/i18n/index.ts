import { getLocales } from "expo-localization";
import { I18n, type TranslateOptions } from "i18n-js";

import { en } from "@/src/shared/i18n/locales/en";
import { es } from "@/src/shared/i18n/locales/es";

export type AppLocalePreference = "system" | "es" | "en";
export type ResolvedLocale = "es" | "en";

export const i18n = new I18n({
  es,
  en,
});

i18n.enableFallback = true;
i18n.defaultLocale = "es";
i18n.locale = "es";

export function resolveLocale(
  preference: AppLocalePreference,
): ResolvedLocale {
  if (preference === "es" || preference === "en") {
    return preference;
  }

  const code =
    getLocales()[0]?.languageCode?.toLowerCase() ?? "es";

  return code.startsWith("en") ? "en" : "es";
}

export function applyLocale(
  preference: AppLocalePreference,
): ResolvedLocale {
  const resolved = resolveLocale(preference);
  i18n.locale = resolved;
  return resolved;
}

export function t(
  key: string,
  options?: TranslateOptions,
): string {
  return i18n.t(key, options);
}

export const LOCALE_OPTIONS: {
  id: AppLocalePreference;
  labelKey: string;
  hintKey?: string;
}[] = [
  {
    id: "system",
    labelKey: "language.system",
    hintKey: "language.systemHint",
  },
  {
    id: "es",
    labelKey: "language.spanish",
  },
  {
    id: "en",
    labelKey: "language.english",
  },
];
