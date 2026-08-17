import type { TranslationTree } from "@/src/shared/i18n/locales/es";

export const en: TranslationTree = {
  common: {
    back: "Back",
    understood: "Got it",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    clear: "Clear",
    premium: "Premium",
    premiumFeature: "Premium feature",
    loading: "Loading…",
    error: "Error",
    yes: "Yes",
    no: "No",
  },
  language: {
    title: "Language",
    description: "Choose the app interface language",
    system: "System",
    systemHint: "Follow the device language",
    spanish: "Español",
    english: "English",
  },
  settings: {
    title: "Settings",
    subtitle: "Global app preferences on this device",
    notifications: "Notifications",
    notificationsHint: "Sound, vibration and filters",
    security: "Security",
    securityHint: "Master password and biometrics",
    backup: "Server backup",
    backupHint: "Export and import · Premium",
    devOnly: "DEV ONLY",
    premiumPlan: "Premium plan",
    premiumPlanHint:
      "Turn it on to try the advanced dashboard. Turn it off to see Free locks.",
    slaHint:
      "SLA targets and other per-instance settings live inside each server.",
  },
  vault: {
    securityTitle: "Security",
    securitySubtitle:
      "Protect access to the app on this device with a master password. Biometrics are an optional shortcut.",
    masterPassword: "Master password",
    masterPasswordHint:
      "At least 6 characters. Only a hash is stored on device; there is no cloud recovery.",
    masterPasswordEnabledHint:
      "Vault is active. You can lock now or disable it by entering the password.",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Repeat password",
    enable: "Enable protection",
    disable: "Disable",
    disableTitle: "Disable vault?",
    disableDescription:
      "The app will stop asking for a password or biometrics on open. Enter the master password to confirm.",
    lockNow: "Lock now",
    unlockTitle: "App locked",
    unlockSubtitle:
      "Enter the master password or use biometrics to continue.",
    unlock: "Unlock",
    useBiometric: "Use fingerprint / Face ID",
    biometric: "Biometric unlock",
    biometricHint:
      "Use fingerprint or Face ID as a shortcut. If it fails, the master password is required.",
    biometricPrompt: "Unlock KumaPulse",
    biometricNeedsVault:
      "Enable the master password first.",
    biometricUnavailable:
      "This device has no biometrics available or enrolled.",
    lockTimeout: "Auto lock",
    lockTimeoutHint:
      "Time in background before unlock is required again.",
    timeoutImmediate: "On leave",
    timeoutMinutes: "%{minutes} min",
    passwordTooShort:
      "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    wrongPassword: "Incorrect password.",
    enabledSuccess: "Protection enabled.",
    disabledSuccess: "Protection disabled.",
    recoveryWarning:
      "If you forget the master password it cannot be recovered. Export a server backup first.",
  },
  backup: {
    title: "Server backup",
    subtitle:
      "Export or import servers with passwords, favorites, SLA and language/notification settings.",
    subtitlePremium:
      "Encrypted server backup is part of Premium.",
    exportTab: "Export",
    importTab: "Import",
    passphrase: "File password",
    passphraseHint:
      "Encrypts the backup. If the vault was unlocked with a password, you can reuse it by leaving this empty.",
    passphraseSessionHint:
      "Leave empty to use this session’s master password.",
    passphrasePlaceholder: "At least 6 characters",
    passphraseTooShort:
      "The file password must be at least 6 characters.",
    servers: "Servers",
    selectAll: "Select all",
    clearSelection: "Clear selection",
    selectServers: "Select at least one server.",
    noServers: "No servers configured.",
    exportIncludes:
      "Includes URL, username, password, 2FA, favorites, SLA target and, optionally on import, language and notification preferences.",
    exportAction: "Export encrypted",
    exportActionPremium: "Export · Premium",
    exportSaved:
      "Backup saved to Downloads:\n%{filename}\n(The first time Android asks you to pick a folder; choose Downloads.)",
    exportFailed: "Could not export the backup.",
    importTitle: "Import backup",
    importHint:
      "Pick an encrypted .kpb file and the same password used to export it.",
    pickFile: "Choose file",
    pickFilePremium: "Choose file · Premium",
    importFound: "%{count} servers in the file",
    favoritesCount: "%{count} favorites",
    overwriteDuplicates: "Overwrite duplicates",
    overwriteDuplicatesHint:
      "If URL and username already exist, update credentials and settings instead of skipping.",
    importAppSettings: "Import app settings",
    importAppSettingsHint:
      "Language and notification preferences from the backup.",
    importAction: "Import selected",
    importSuccess:
      "Imported %{imported}, updated %{updated}, skipped %{skipped}.",
    importFailed: "Could not import the backup.",
    pickerUnavailable:
      "The file picker requires a newer build of the app.",
    premiumDescription:
      "Exporting and importing servers with credentials and settings is a Premium feature.",
  },
  servers: {
    title: "Servers",
    add: "Add server",
    emptyTitle: "No servers",
    emptyDescription: "Add your first Uptime Kuma instance.",
    settings: "Settings",
  },
  monitors: {
    title: "Monitors",
    searchPlaceholder: "Search name, URL or tag",
    clearSearch: "Clear search",
    filterAll: "All",
    filterUp: "UP",
    filterDown: "DOWN",
    filterPaused: "Paused",
    filterFavorites: "Favorites",
    tags: "Tags",
    showing: "Showing %{shown} of %{total}",
    tagsCount: "%{count} tags",
    loadMore: "Load more (%{remaining} left)",
    noResults: "No results",
    noResultsHint: "Try another search, tag or filter.",
    lockedTitle: "%{count} monitors locked",
    lockedDescription:
      "Free allows up to %{limit} monitors. Premium unlocks every monitor on this instance.",
    favoritesLimitTitle: "Favorites limit",
    favoritesLimitDescription:
      "Free allows up to 3 favorites per server. Premium unlocks unlimited favorites.",
    tagPremiumDescription:
      "Filtering monitors by tags is part of Premium.",
    serverNotFound: "Server not found",
    serverNotFoundHint:
      "The selected instance could not be found.",
    backToServers: "Back to servers",
    realtimeStatus: "Live status for this instance.",
    cachedStatus: "Cached data · %{when}",
    waitingStatus: "Waiting for data from this instance.",
    advancedDashboard: "Advanced dashboard",
    advancedDashboardPremium: "Advanced dashboard Premium",
    operations: "Operations center",
  },
  timeline: {
    title: "Timeline",
    chooseServer: "Pick a server",
    chooseServerHint:
      "The timeline only makes sense inside an Uptime Kuma instance.",
    historyOf:
      "History for %{name}, cached locally and refreshed in the background.",
    refreshing: "Refreshing history...",
    eventsCount: "%{count} events",
    exportCsv: "Export Excel report",
    exportCsvPremium: "Export Excel · Premium",
    exportHint:
      "Report with overview, monitor activity and visible events",
    exportPremiumHint: "The Excel report is included in Premium",
    exportPremiumDescription:
      "Exporting the timeline as an Excel report is included in Premium. Free can browse history but not download it.",
    exportFailed: "Export failed",
    exportSaved: "Excel report saved",
    loading: "Loading timeline...",
    emptyTitle: "No events yet",
  },
  analytics: {
    title: "Advanced dashboard",
    chooseServer: "Pick a server",
    chooseServerHint:
      "The advanced dashboard only makes sense inside an Uptime Kuma instance.",
    premiumTitle: "Premium feature",
    premiumDescription:
      "Health Score, SLA, rankings, heatmap, trends, MTTR/MTBF, SSL, comparisons and insights are part of the advanced dashboard.",
    limitedHistory:
      "Some metrics are estimated from local history. With few events the period may be incomplete.",
    backToModules: "Back to modules",
    exportTitle: "Export",
    exportCsv: "Export Excel report",
    exportCsvPremium: "Export · Premium",
    exportHint:
      "Excel with overview, monitors, trends, SLA/SSL and heatmap",
    exportPremiumHint: "The Excel report is included in Premium",
    exportFailed: "Export failed",
    exportSaved: "Excel report saved",
    sections: {
      health: "Health Score",
      summary: "Summary",
      availability: "Availability",
      latency: "Latency",
      status: "Statuses",
      priority: "Priority",
      incidents: "Incidents",
      sla: "SLA",
      comparatives: "Comparisons",
      availabilityRanking: "Uptime ranking",
      latencyRanking: "Latency ranking",
      ssl: "SSL",
      heatmap: "Heatmap",
      activity: "Activity",
      trends: "Trends",
      insights: "Insights",
      export: "Export",
    },
  },
  export: {
    savedIn:
      "Saved to Downloads:\n%{filename}\n(The first time Android asks you to pick a folder; choose Downloads.)",
    noEvents: "There are no events to export with the current filter.",
    noMonitors: "There are no monitors to export in this window.",
  },
  permission: {
    title: "Notifications",
    description:
      "KumaPulse can notify you when a monitor changes status.",
    allow: "Allow",
    later: "Not now",
  },
};
