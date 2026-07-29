import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import {
  applyLocale,
  resolveLocale,
  t as translate,
  type AppLocalePreference,
  type ResolvedLocale,
} from "@/src/shared/i18n";
import type { TranslateOptions } from "i18n-js";

export function useTranslation() {
  const locale = useAppSettingsStore(
    (state) => state.locale,
  );
  const setLocalePreference = useAppSettingsStore(
    (state) => state.setLocale,
  );
  const resolvedLocale = resolveLocale(locale);

  // Dependencia explícita para forzar re-render al cambiar idioma.
  void resolvedLocale;

  function t(
    key: string,
    options?: TranslateOptions,
  ): string {
    return translate(key, options);
  }

  function setLocale(next: AppLocalePreference) {
    applyLocale(next);
    setLocalePreference(next);
  }

  return {
    t,
    locale,
    resolvedLocale: resolvedLocale as ResolvedLocale,
    setLocale,
  };
}
