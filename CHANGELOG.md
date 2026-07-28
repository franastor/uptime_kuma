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
