# Validación Sprint 10.1

Desde la raíz del proyecto:

```bash
npm install
npx tsc --noEmit
npm run lint
npx expo start --clear
```

Prueba manual:

1. Abre una instancia que tenga monitores operativos, pausados, pendientes o sin datos.
2. Pulsa cada tarjeta del resumen y confirma que aplica el filtro correcto.
3. Comprueba que la pantalla se desplaza automáticamente hasta la lista de monitores.
4. Pulsa un monitor del Centro de operaciones y confirma que muestra el grupo correspondiente.
5. Verifica que los contadores coinciden con el número de monitores visibles para cada filtro.
6. Comprueba que los monitores `unknown` aparecen como «Sin datos» y no como incidencia crítica.
7. Confirma que búsqueda, favoritos y filtros manuales siguen funcionando.
