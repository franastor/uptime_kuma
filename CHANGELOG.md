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

## [0.5.1] - Sprint 10.1

### Añadido
- Tarjetas de resumen interactivas para filtrar monitores operativos, con incidencias, sin datos y pausados.
- Filtro específico para monitores pendientes, en mantenimiento o sin comprobaciones.
- Navegación desde cada elemento del Centro de operaciones hasta la lista filtrada.
- Desplazamiento automático hacia la sección de monitores al seleccionar un estado.
- Transición suave al cambiar los filtros del dashboard.

### Mejorado
- Lógica de estado centralizada en `monitorState.ts` para que resumen, filtros e incidencias utilicen la misma clasificación.
- Centro de operaciones ampliado para identificar también los monitores sin datos.
- Tarjetas accesibles con estado seleccionado y respuesta visual al pulsarlas.
- Contadores del resumen alineados con los monitores realmente mostrados.
