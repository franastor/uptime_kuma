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
    devOnly: "SOLO DESARROLLO",
    premiumPlan: "Plan Premium",
    premiumPlanHint:
      "Actívalo para probar el Dashboard avanzado. Desactívalo para ver el candado Free.",
    slaHint:
      "El objetivo SLA y otros ajustes de cada instancia están dentro del servidor.",
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
    exportCsv: "Exportar CSV",
    exportCsvPremium: "Exportar CSV · Premium",
    exportHint:
      "Guarda los eventos visibles con el filtro actual",
    exportPremiumHint:
      "La exportación CSV está incluida en Premium",
    exportPremiumDescription:
      "Exportar el timeline a CSV está incluido en Premium. En Free puedes consultar el historial, pero no descargarlo.",
    exportFailed: "No se pudo exportar",
    exportSaved: "CSV guardado",
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
    exportCsv: "Exportar analytics CSV",
    exportCsvPremium: "Exportar · Premium",
    exportHint:
      "Guarda métricas globales y una fila por monitor",
    exportPremiumHint:
      "La exportación CSV está incluida en Premium",
    exportFailed: "No se pudo exportar",
    exportSaved: "CSV guardado",
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
    savedIn: "Guardado en Documentos/exports:\n%{filename}",
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
