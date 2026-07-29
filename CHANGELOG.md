# Changelog

## v0.8.4 — Dashboard avanzado completo (PDF)

- El Dashboard avanzado Premium cubre ya los bloques de la propuesta: Health Score, disponibilidad 24 h/7 d/30 d/90 d, latencia (media, pico, P95), monitores prioritarios, incidencias activas, distribución por estado, rankings (disponibilidad y latencia), actividad reciente, SSL, comparativas e insights.
- Ventana de 90 días añadida al selector.
- Latencia y comparativas usan heartbeats locales + timeline para el periodo anterior.
- Free: máximo **10 monitores** por servidor en orden alfabético; el resto queda bloqueado hasta Premium.
- Navegación modular dentro del Dashboard avanzado: cada bloque es un botón y solo se muestra la sección elegida, evitando una pantalla excesivamente larga.
- Sigue bloqueado detrás de `advanced-dashboard` (Premium).

## v0.8.3 — Dashboard avanzado como Premium

- SLA, rankings, heatmap, MTTR/MTBF y el resto de Analytics pasan a formar parte del **Dashboard avanzado** (feature `advanced-dashboard`).
- En Free el acceso muestra candado / pantalla Premium; el resumen, timeline, incidencias y monitores siguen libres.
- La tarjeta «Dashboard avanzado» del servidor es la entrada: en Premium abre la analítica; en Free queda bloqueada con el modal de la app.
- En desarrollo (`__DEV__`) el plan por defecto es Premium; en Ajustes hay un interruptor Free/Premium para probar ambos modos.
- El objetivo SLA en ajustes del servidor también queda detrás de Premium.

## v0.8.2 — Corrección del estado SLA

- Superar el objetivo ya cuenta como cumplido: con objetivo 99 % un uptime del 99,7 % deja de marcarse como incumplido.
- «En riesgo» pasa a basarse en el presupuesto de error (avisa al consumir el 75 % del margen permitido) en lugar de un umbral fijo a medio camino de 100 %.
- El estado del resumen se calcula con el uptime medio contra el objetivo, no con el peor monitor.
- Los monitores por debajo del objetivo siguen listándose aparte, ahora con su propio encabezado.

## v0.8.1 — Objetivo SLA configurable

- El objetivo SLA se configura **dentro de cada servidor** (Ajustes del servidor), no en los ajustes globales.
- Ruleta de presets 95 % … 100 % por instancia.
- Analytics evalúa cada monitor contra el umbral de su servidor.
- Timeline, Analytics y ajustes del servidor solo se abren desde dentro de una instancia.
- Los ajustes globales de la app siguen en el engranaje del listado (notificaciones hoy; más adelante el resto).
- Al borrar un servidor se elimina también su objetivo SLA.

## v0.8.0 — Sprint 13: Analytics

- Nueva pantalla Analytics con resumen de uptime, downtime, incidencias, ping medio, MTTR, MTBF y SLA (objetivo 99.9 %).
- Selector de ventana 24 h / 7 días / 30 días y filtro por servidor.
- Heatmap de caídas por día de la semana y hora local, reconstruido desde el timeline.
- Ranking de monitores inestables (downtime, incidencias, uptime) con acceso al detalle.
- Uptime y ping medio priorizan las estadísticas oficiales de Uptime Kuma; MTTR/MTBF y heatmap usan el histórico local.
- Acceso desde la lista de servidores y desde el dashboard de cada servidor.

## v0.7.3 — Disponibilidad por tramos

- La cuadrícula de disponibilidad ya no dibuja un bloque por heartbeat, sino tramos de tiempo, de modo que una caída de hace horas sigue siendo visible.
- Selector de ventana de 24 h y 7 días.
- Los tramos se reconstruyen combinando los heartbeats recientes con los cambios de estado del histórico, que cubren mucho más tiempo.
- Los tramos sin datos se muestran en gris en lugar de darse por operativos.

## v0.7.2 — Corrección de fechas de heartbeats

- Las marcas de tiempo de Uptime Kuma se interpretan como UTC y en un formato que Hermes sí parsea, así que la cuadrícula de disponibilidad ya refleja las caídas reales.
- El timeline y los tiempos relativos («hace X») dejan de desplazarse según la zona horaria del dispositivo.
- La cuadrícula indica el número de checks y el rango temporal que abarca.
- Se descarta la caché anterior de heartbeats y timeline, que guardaba fechas incorrectas.

## v0.7.1 — Caché de monitores y monitores pausados

- Nueva pantalla de detalle por monitor con estado actual, respuesta, uptime de la ventana local, incidencias, timeline, heartbeats e historial.
- Estadísticas oficiales de Uptime Kuma en el detalle: ping medio de 24 h, uptime de 24 h y 30 días, downtime derivado y caducidad SSL.
- Cuadrícula visual de disponibilidad con los checks recientes en verde, rojo, amarillo o mantenimiento.
- Caché persistente de estadísticas por monitor para mostrarlas sin esperar al socket.
- Timeline vertical UP/DOWN en el detalle y en el historial específico de cada monitor.
- Mini-caché persistente de hasta 100 heartbeats por monitor.
- Las tarjetas de monitor, los eventos y las notificaciones abren directamente el detalle.
- Mini-caché persistente de la lista de monitores por servidor: el resumen y el centro de operaciones se pintan al instante al entrar y se refrescan en segundo plano.
- Escritura agrupada (1,5 s) para no castigar el almacenamiento con cada heartbeat.
- El resumen indica «Datos guardados · hace X» mientras no hay conexión en directo.
- La caché se borra al eliminar o editar un servidor.
- Los monitores pausados ya no aparecen como incidencia «pendiente» en el centro de operaciones.
- El contador de incidencias activas y la lista muestran ahora exactamente los mismos monitores.
- `active` se interpreta bien aunque Uptime Kuma lo envíe como `0`/`1` o texto.
- `updateMonitorIntoList` se acepta tanto en formato diccionario como monitor suelto.
- Sin notificaciones para monitores pausados.

## v0.7.0 — Sprint 12: Timeline

- Timeline global de cambios de estado importantes.
- Timeline por servidor y por monitor.
- Ingesta en vivo desde heartbeats `important`, `heartbeatList` y `importantHeartbeatList`.
- Persistencia local (AsyncStorage, máx. 500 eventos) como mini-caché: al entrar se muestra al instante y se refresca en segundo plano.
- Búsqueda y filtros por estado (UP/DOWN/pending/maintenance).
- Acceso desde la lista de servidores, el dashboard del servidor y cada monitor.
- Al conectar, el último heartbeat de cada monitor actualiza el estado operativo sin esperar al siguiente check.

## v0.6.3 — Sprint 11C (parcial): Notification Preferences

- Preferencias de notificaciones locales: activar/desactivar, sonido y vibración.
- Filtrado por etiquetas (Premium / `advanced-filters`).
- Pantalla de ajustes accesible desde la lista de servidores.
- Preparación Premium: el filtro por tags queda bloqueado en Free.
- Aviso explícito de que los avisos solo funcionan con la app en primer plano.

## v0.6.2 — Sprint 11B.2: Smart Notifications MVP

- Integración de notificaciones locales con heartbeats Socket.IO (`important` UP/DOWN).
- Historial persistente de notificaciones (AsyncStorage, máx. 100).
- Deduplicación de eventos repetidos.
- Deep link al monitor: al pulsar se abre `/monitor/[serverId]` con resaltado.
- Preferencias mínimas (`enabled`, default activo); UI avanzada en 11C.
- Solo notificaciones locales (sin push remotas).
- Dependencia `expo-notifications` y canal Android `monitor-status`.
- Centro de operaciones expandible/colapsable.
- Sesión persistente de 24 h para reutilizar `loginByToken` y evitar pedir 2FA en cada acceso.
- Re-autenticación automática tras reconectar el socket; si la sesión ya no es válida, se vuelve a pedir acceso.

## v0.6.1 — Notification Foundation

- Añadido el esqueleto de arquitectura de notificaciones.

## v0.6.0 — Sprint 11A: KumaPulse Branding

- Renombrada la aplicación a **KumaPulse**.
- Configurados nombre, slug, scheme e identificadores de Android/iOS.
- Nuevo icono, icono adaptativo, favicon y splash.
- Añadido el eslogan “Stay connected to your uptime.”.
- Incorporados tokens de marca, radios y sombras al sistema de diseño.
- Nueva cabecera de marca reutilizable en la pantalla de conexión.
- Actualizados metadatos y documentación del proyecto.

# Sprint 9 - Corrección de lint

## Cambios

- Se estabiliza la referencia de favoritos con `useMemo` para evitar cambios de dependencias en cada render.
- Se sustituye `Array<T>` por `T[]` en la definición de filtros para cumplir la regla de ESLint.

## Validación

```bash
npx tsc --noEmit
npm run lint
```

## Sprint 10 - Centro de Operaciones

- Añadido un centro de operaciones dentro de la pantalla de monitores.
- Priorización de incidencias críticas y comprobaciones pendientes.
- Tarjetas de incidencia con mensaje, antigüedad y ping.
- Estado saludable cuando no existen incidencias activas.
- Protección adicional frente a promesas rechazadas durante la confirmación 2FA.
