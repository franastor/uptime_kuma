# Sprint 8 — Dashboard y base Free/Premium

## Cambios

- Dashboard de estado por servidor con métricas en tiempo real.
- Tarjetas para total, operativos, incidencias y ping medio.
- Resumen de monitores pausados y todavía sin datos.
- Identificación visual del plan Free o Premium.
- Aviso del futuro dashboard avanzado Premium.
- Arquitectura centralizada para controlar funcionalidades por plan.
- Límite Free preparado para un servidor y Premium para servidores ilimitados.
- Persistencia local del plan, preparada para conectarse más adelante a Google Play Billing y App Store.

## Archivos principales

- `app/_layout.tsx`
- `app/monitor/[serverId].tsx`
- `src/shared/components/StatCard.tsx`
- `src/modules/dashboard/`
- `src/modules/subscription/`

## Validación

```bash
npx tsc --noEmit
npm run lint
```

## Prueba manual

1. Abre un servidor y espera a que carguen sus monitores.
2. Comprueba que el dashboard muestra las cifras correctas.
3. Provoca o espera un heartbeat y verifica que las cifras cambian en tiempo real.
4. Comprueba que debajo aparece el aviso del dashboard avanzado Premium.
