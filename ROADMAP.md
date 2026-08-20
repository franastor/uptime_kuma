# Roadmap / pendientes

## Multi-usuario + Free/Premium (plan 20/08/2026 — para cuando toque distribuir)

La app ya tiene el esqueleto premium (`src/modules/subscription/`, `canUseFeature()`). El push backend (`kumapulse-push`, `push.franastor.com`) es hoy **monousuario**: `/api/register` no asocia token a serverId/usuario y el webhook envía a TODOS los tokens. Para abrirla a más usuarios hay que hacer (en este orden):

- [ ] **Backend multi-tenant**: `/api/register` acepta `serverId` (+ opcional `userId`/installationId) y guarda `tokens: [{token, serverId, ...}]`; el webhook filtra `tokens.filter(t => t.serverId === serverId)`. Rate-limit básico en `/api/webhook` (público, evita spam).
- [ ] **Pantalla de ajustes**: mostrar URL pública `https://push.franastor.com/api/webhook/<serverId>` + instrucción de header `X-API-Key` con WEBHOOK_KEY (hoy muestra la URL LAN `http://192.168.1.18:5830/...`, inservible fuera de casa).
- [ ] **Registro con userId** (decisión: instalación anónima vs cuenta email/contraseña; para empezar anónima + serverId basta, sin BD de usuarios).
- [ ] **Gate premium del push**: el backend decide según plan del usuario (free = sin push o limitado; premium = push). Sincronizar plan con backend para que no baste desbloquear local.
- [ ] **PUSH = PREMIUM (decisión de Fran 20/08/2026)**: las notificaciones push con app cerrada serán parte del plan Premium. Cuando se implemente el gate, el push queda bloqueado para cuentas free (o con límite de monitores/avisos).
- [ ] RevenueCat cuando toque cobrar Premium de verdad (ya está en la lista de abajo).

Nota: el backend de push vive en el homelab de Fran (192.168.1.18:5830) y aguanta perfectamente una app de este tamaño. No hace falta cloud de pago al principio.

## UX filtros

- [ ] **Multiselector de etiquetas** en la lista de monitores: las tags siguen saliendo del servidor (`collectAvailableTags`), pero en lugar de pintar todas como chips en fila (insostenible con muchas), abrir un modal/bottom sheet con búsqueda + checklist. En la barra de filtros solo chips de las ya seleccionadas + botón «Etiquetas».

## Publicación / producto (contexto)

- [ ] Build `preview` instalable sin Metro (closed testing Android).
- [ ] Política de privacidad / términos para tiendas.
- [ ] RevenueCat cuando toque cobrar Premium de verdad.
- [ ] Sync cloud del vault (fase 2; v1 es local + export/import).
