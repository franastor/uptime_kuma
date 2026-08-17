export const es = {
  common: {
    back: "Volver",
    understood: "Entendido",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    clear: "Limpiar",
    premium: "Premium",
    premiumFeature: "Función Premium",
    loading: "Cargando…",
    error: "Error",
    yes: "Sí",
    no: "No",
  },
  language: {
    title: "Idioma",
    description: "Elige el idioma de la interfaz",
    system: "Sistema",
    systemHint: "Usa el idioma del dispositivo",
    spanish: "Español",
    english: "English",
  },
  settings: {
    title: "Ajustes",
    subtitle:
      "Preferencias globales de la app en este dispositivo",
    notifications: "Notificaciones",
    notificationsHint: "Sonido, vibración y filtros",
    security: "Seguridad",
    securityHint: "Contraseña maestra y huella",
    backup: "Copia de servidores",
    backupHint: "Exportar e importar · Premium",
    devOnly: "SOLO DESARROLLO",
    premiumPlan: "Plan Premium",
    premiumPlanHint:
      "Actívalo para probar el Dashboard avanzado. Desactívalo para ver el candado Free.",
    slaHint:
      "El objetivo SLA y otros ajustes de cada instancia están dentro del servidor.",
  },
  vault: {
    securityTitle: "Seguridad",
    securitySubtitle:
      "Protege el acceso a la app en este dispositivo con una contraseña maestra. La huella es un atajo opcional.",
    masterPassword: "Contraseña maestra",
    masterPasswordHint:
      "Mínimo 6 caracteres. Se guarda solo un hash en el dispositivo; no hay recuperación en la nube.",
    masterPasswordEnabledHint:
      "El vault está activo. Puedes bloquear ahora o desactivarlo introduciendo la contraseña.",
    passwordPlaceholder: "Contraseña",
    confirmPasswordPlaceholder: "Repite la contraseña",
    enable: "Activar protección",
    disable: "Desactivar",
    disableTitle: "¿Desactivar el vault?",
    disableDescription:
      "La app dejará de pedir contraseña o huella al abrir. Introduce la contraseña maestra para confirmar.",
    lockNow: "Bloquear ahora",
    unlockTitle: "App bloqueada",
    unlockSubtitle:
      "Introduce la contraseña maestra o usa la huella para continuar.",
    unlock: "Desbloquear",
    useBiometric: "Usar huella / Face ID",
    biometric: "Desbloqueo biométrico",
    biometricHint:
      "Usa huella o Face ID como atajo. Si falla, se pedirá la contraseña maestra.",
    biometricPrompt: "Desbloquear KumaPulse",
    biometricNeedsVault:
      "Activa primero la contraseña maestra.",
    biometricUnavailable:
      "Este dispositivo no tiene biometría disponible o enrolada.",
    lockTimeout: "Bloqueo automático",
    lockTimeoutHint:
      "Tiempo en segundo plano antes de volver a pedir desbloqueo.",
    timeoutImmediate: "Al salir",
    timeoutMinutes: "%{minutes} min",
    passwordTooShort:
      "La contraseña debe tener al menos 6 caracteres.",
    passwordMismatch: "Las contraseñas no coinciden.",
    wrongPassword: "Contraseña incorrecta.",
    enabledSuccess: "Protección activada.",
    disabledSuccess: "Protección desactivada.",
    recoveryWarning:
      "Si olvidas la contraseña maestra no se puede recuperar. Exporta antes una copia de seguridad de servidores.",
  },
  backup: {
    title: "Copia de servidores",
    subtitle:
      "Exporta o importa servidores con contraseñas, favoritos, SLA e idioma/notificaciones.",
    subtitlePremium:
      "La copia cifrada de servidores forma parte de Premium.",
    exportTab: "Exportar",
    importTab: "Importar",
    passphrase: "Contraseña del archivo",
    passphraseHint:
      "Cifra el backup. Si tienes el vault desbloqueado con pass, puedes reutilizarla dejando este campo vacío.",
    passphraseSessionHint:
      "Si dejas el campo vacío se usará la contraseña maestra de esta sesión.",
    passphrasePlaceholder: "Mínimo 6 caracteres",
    passphraseTooShort:
      "La contraseña del archivo debe tener al menos 6 caracteres.",
    servers: "Servidores",
    selectAll: "Seleccionar todos",
    clearSelection: "Quitar selección",
    selectServers: "Selecciona al menos un servidor.",
    noServers: "No hay servidores configurados.",
    exportIncludes:
      "Incluye URL, usuario, contraseña, 2FA, favoritos, objetivo SLA y, opcionalmente al importar, idioma y preferencias de notificaciones.",
    exportAction: "Exportar cifrado",
    exportActionPremium: "Exportar · Premium",
    exportSaved:
      "Backup guardado en Descargas:\n%{filename}\n(La primera vez Android te pide elegir la carpeta; elige Descargas.)",
    exportFailed: "No se pudo exportar el backup.",
    importTitle: "Importar backup",
    importHint:
      "Elige un archivo .kpb cifrado y la misma contraseña con la que se exportó.",
    pickFile: "Elegir archivo",
    pickFilePremium: "Elegir archivo · Premium",
    importFound: "%{count} servidores en el archivo",
    favoritesCount: "%{count} favoritos",
    overwriteDuplicates: "Sobrescribir duplicados",
    overwriteDuplicatesHint:
      "Si URL y usuario ya existen, actualiza credenciales y ajustes en lugar de saltarlos.",
    importAppSettings: "Importar ajustes de app",
    importAppSettingsHint:
      "Idioma y preferencias de notificaciones del backup.",
    importAction: "Importar seleccionados",
    importSuccess:
      "Importados %{imported}, actualizados %{updated}, omitidos %{skipped}.",
    importFailed: "No se pudo importar el backup.",
    pickerUnavailable:
      "El selector de archivos necesita una build más reciente de la app.",
    premiumDescription:
      "Exportar e importar servidores con sus credenciales y ajustes es una función Premium.",
  },
  servers: {
    title: "Servidores",
    add: "Añadir servidor",
    emptyTitle: "Sin servidores",
    emptyDescription:
      "Añade tu primera instancia de Uptime Kuma.",
    settings: "Ajustes",
  },
  monitors: {
    title: "Monitores",
    searchPlaceholder: "Buscar nombre, URL o etiqueta",
    clearSearch: "Limpiar búsqueda",
    filterAll: "Todos",
    filterUp: "UP",
    filterDown: "DOWN",
    filterPaused: "Pausados",
    filterFavorites: "Favoritos",
    tags: "Etiquetas",
    showing: "Mostrando %{shown} de %{total}",
    tagsCount: "%{count} etiquetas",
    loadMore: "Cargar más (%{remaining} restantes)",
    noResults: "Sin resultados",
    noResultsHint:
      "Prueba con otra búsqueda, etiqueta o filtro.",
    lockedTitle: "%{count} monitores bloqueados",
    lockedDescription:
      "Free permite hasta %{limit} monitores. Premium desbloquea todos los de esta instancia.",
    favoritesLimitTitle: "Límite de favoritos",
    favoritesLimitDescription:
      "La versión Free permite guardar hasta 3 favoritos por servidor. Premium ofrece favoritos ilimitados.",
    tagPremiumDescription:
      "Filtrar monitores por etiquetas forma parte de Premium.",
    serverNotFound: "Servidor no encontrado",
    serverNotFoundHint:
      "No se ha podido localizar la instancia seleccionada.",
    backToServers: "Volver a servidores",
    realtimeStatus: "Estado en tiempo real de esta instancia.",
    cachedStatus: "Datos guardados · %{when}",
    waitingStatus: "Esperando datos de esta instancia.",
    advancedDashboard: "Dashboard avanzado",
    advancedDashboardPremium: "Dashboard avanzado Premium",
    operations: "Centro de operaciones",
  },
  timeline: {
    title: "Timeline",
    chooseServer: "Elige un servidor",
    chooseServerHint:
      "El timeline solo tiene sentido dentro de una instancia de Uptime Kuma.",
    historyOf: "Historial de %{name}, en caché local y actualizado en segundo plano.",
    refreshing: "Actualizando histórico...",
    eventsCount: "%{count} eventos",
    exportCsv: "Exportar informe Excel",
    exportCsvPremium: "Exportar Excel · Premium",
    exportHint:
      "Informe con resumen, actividad por monitor y eventos visibles",
    exportPremiumHint:
      "El informe Excel está incluido en Premium",
    exportPremiumDescription:
      "Exportar el timeline como informe Excel está incluido en Premium. En Free puedes consultar el historial, pero no descargarlo.",
    exportFailed: "No se pudo exportar",
    exportSaved: "Informe Excel guardado",
    loading: "Cargando timeline...",
    emptyTitle: "Sin eventos todavía",
  },
  analytics: {
    title: "Dashboard avanzado",
    chooseServer: "Elige un servidor",
    chooseServerHint:
      "El dashboard avanzado solo tiene sentido dentro de una instancia de Uptime Kuma.",
    premiumTitle: "Función Premium",
    premiumDescription:
      "Health Score, SLA, rankings, heatmap, tendencias, MTTR/MTBF, SSL, comparativas e insights forman parte del Dashboard avanzado.",
    limitedHistory:
      "Parte de las métricas se estiman con el histórico local. Con pocos eventos el periodo puede ser incompleto.",
    backToModules: "Subir a módulos",
    exportTitle: "Exportar",
    exportCsv: "Exportar informe Excel",
    exportCsvPremium: "Exportar · Premium",
    exportHint:
      "Excel con resumen, monitores, tendencias, SLA/SSL y heatmap",
    exportPremiumHint:
      "El informe Excel está incluido en Premium",
    exportFailed: "No se pudo exportar",
    exportSaved: "Informe Excel guardado",
    sections: {
      health: "Health Score",
      summary: "Resumen",
      availability: "Disponibilidad",
      latency: "Latencia",
      status: "Estados",
      priority: "Prioritarios",
      incidents: "Incidencias",
      sla: "SLA",
      comparatives: "Comparativas",
      availabilityRanking: "Ranking uptime",
      latencyRanking: "Ranking latencia",
      ssl: "SSL",
      heatmap: "Heatmap",
      activity: "Actividad",
      trends: "Tendencias",
      insights: "Insights",
      export: "Exportar",
    },
  },
  export: {
    savedIn:
      "Guardado en Descargas:\n%{filename}\n(La primera vez Android te pide elegir la carpeta; elige Descargas.)",
    noEvents: "No hay eventos para exportar con el filtro actual.",
    noMonitors: "No hay monitores para exportar en esta ventana.",
  },
  permission: {
    title: "Notificaciones",
    description:
      "KumaPulse puede avisarte cuando un monitor cambie de estado.",
    allow: "Permitir",
    later: "Ahora no",
  },
} as const;

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : DeepStringRecord<T[K]>;
};

export type TranslationTree = DeepStringRecord<typeof es>;
