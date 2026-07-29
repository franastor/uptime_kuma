# Changelog

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
