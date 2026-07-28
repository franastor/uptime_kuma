# Sprint 9 - Corrección de lint

## Cambios

- Se estabiliza la referencia de favoritos con `useMemo` para evitar cambios de dependencias en cada render.
- Se sustituye `Array<T>` por `T[]` en la definición de filtros para cumplir la regla de ESLint.

## Validación

```bash
npx tsc --noEmit
npm run lint
```
