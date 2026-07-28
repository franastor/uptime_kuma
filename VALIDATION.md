# Validación Sprint 10

Desde la raíz del proyecto:

```bash
npx tsc --noEmit
npm run lint
```

Prueba manual:

1. Conecta una instancia con 2FA y confirma que cualquier error aparece dentro del modal.
2. Abre una instancia con monitores caídos o pendientes.
3. Comprueba que el Centro de operaciones los ordena por prioridad.
4. Cuando no haya incidencias, debe mostrarse el estado saludable.
