#!/bin/sh
# ============================================================
# load-secrets.sh — KumaPulse (kumapulse-app)
#
# Baja de Infisical los secretos de notificaciones push y los
# materializa en el repo:
#   - KUMAPULSE_GOOGLE_SERVICES_JSON  ->  google-services.json (raíz)
#   - KUMAPULSE_PUSH_BACKEND_URL / KUMAPULSE_PUSH_APP_KEY -> env (si source)
#
# Si hay EXPORT_MAP definido y el script se invoca con `source`
# (p.ej. `. scripts/load-secrets.sh` desde un wrapper de build),
# exporta las EXPO_PUBLIC_* al shell actual (solo si no están ya
# definidas). Ejecutado standalone, exportar no hace daño: el
# entorno muere con el proceso.
#
# FAIL-OPEN (mismo patrón que xufas-play/lib.sh):
#   - Sin client secret / Infisical caído / clave ausente:
#       * si google-services.json ya existe localmente -> avisa y CONTINÚA
#       * si NO existe -> avisa y ABORTA (exit 1)
#   - Uso previsto en el homelab (nodo1, host o Cronicle); si se ejecuta
#     en otro sitio sin acceso a Infisical y el fichero ya está generado,
#     el script no bloquea el build.
# ============================================================

# Detectar raíz: host (/home/franastor) o contenedor Cronicle (/host/home/franastor)
if [ -d "/home/franastor" ]; then
    ROOT="/home/franastor"
else
    ROOT="/host/home/franastor"
fi

REPO="$ROOT/portainer/repos/kumapulse-app"
GOOGLE_FILE="$REPO/google-services.json"

# --- Infisical (proyecto "Bot Telegram", env prod, path /) ---
# El client_secret se lee del docker-compose del bot (nunca hardcodeado).
INFISICAL_API="${INFISICAL_API:-http://192.168.1.18:8181}"
INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:-614a1244-37f4-4063-88e1-7e6544b66e5f}"
INFISICAL_CLIENT_ID="${INFISICAL_CLIENT_ID:-6cc2e391-11c7-4c21-b792-93b4d1bac091}"
INFISICAL_CLIENT_SECRET="${INFISICAL_CLIENT_SECRET:-$(grep -oP 'INFISICAL_CLIENT_SECRET=\K[^ \r\n]+' "$ROOT/portainer/bot-telegram/docker-compose.yml" 2>/dev/null | tr -d ' \r\n')}"

# Clave del secreto en Infisical que contiene google-services.json
GOOGLE_SECRET_KEY="KUMAPULSE_GOOGLE_SERVICES_JSON"

# Mapa de secretos Infisical -> EXPO_PUBLIC_* a exportar (formato src:dst, coma).
# KumaPulse: la app lee en build time EXPO_PUBLIC_PUSH_BACKEND_URL y
# EXPO_PUBLIC_PUSH_APP_KEY (valores reales: los del contenedor kumapulse-expo).
EXPORT_MAP="KUMAPULSE_PUSH_BACKEND_URL:EXPO_PUBLIC_PUSH_BACKEND_URL,KUMAPULSE_PUSH_APP_KEY:EXPO_PUBLIC_PUSH_APP_KEY"

notify() { echo "[load-secrets] $*"; }

# Materializa google-services.json desde Infisical (fail-open) y, si hay
# EXPORT_MAP, escribe un fichero temporal KEY=VALUE (0600) para exportar.
load_secrets() {
    TMPDIR_D="${TMPDIR:-/tmp}"
    ENV_TMP="$TMPDIR_D/kumapulse-loadsecrets.env"
    rm -f "$ENV_TMP"

    if [ -z "$INFISICAL_CLIENT_SECRET" ]; then
        notify "⚠️  Sin client secret de Infisical; compruebo fichero local…"
        if [ -f "$GOOGLE_FILE" ]; then notify "✅ google-services.json ya existe; continúo (fail-open)."; return 0; fi
        notify "❌ google-services.json ausente y sin Infisical. Abortando."
        exit 1
    fi

    python3 - "$INFISICAL_API" "$INFISICAL_PROJECT_ID" "$INFISICAL_CLIENT_ID" "$INFISICAL_CLIENT_SECRET" \
        "$GOOGLE_SECRET_KEY" "$GOOGLE_FILE" "$ENV_TMP" "$EXPORT_MAP" <<'PYEOF'
import json, os, sys, urllib.request

api, pid, cid, csec, gkey, gfile, env_tmp, export_map = sys.argv[1:9]
TIMEOUT = 5


def login():
    req = urllib.request.Request(
        f"{api}/api/v1/auth/universal-auth/login",
        data=json.dumps({"clientId": cid, "clientSecret": csec}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())["accessToken"]


def fetch(token):
    req = urllib.request.Request(
        f"{api}/api/v4/secrets?projectId={pid}&environment=prod&secretPath=/",
        headers={"Authorization": f"Bearer {token}"}, method="GET")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return {s.get("secretKey"): str(s.get("secretValue") or "")
                for s in (json.loads(r.read()).get("secrets") or [])}


try:
    secrets = fetch(login())
except Exception as exc:  # noqa: BLE001 - fail-open
    print(f"ERROR: {exc}", file=sys.stderr)
    sys.exit(1)

# google-services.json
if gkey not in secrets:
    sys.exit(2)  # clave ausente en Infisical
value = secrets[gkey]
try:
    json.loads(value)  # valida que sea JSON válido
except Exception as exc:
    print(f"ERROR: {gkey} no es JSON válido: {exc}", file=sys.stderr)
    sys.exit(1)
with open(gfile + ".tmp", "w") as f:
    f.write(value)
os.chmod(gfile + ".tmp", 0o600)
os.replace(gfile + ".tmp", gfile)

# Export map (KEY=VALUE por línea, 0600; el shell lo carga y borra)
if export_map:
    with open(env_tmp, "w") as f:
        for pair in export_map.split(","):
            src, dst = pair.split(":", 1)
            if src in secrets:
                f.write(f"{dst}={secrets[src]}\n")
    os.chmod(env_tmp, 0o600)
print("OK")
PYEOF
    STATUS=$?
    if [ $STATUS -eq 0 ]; then
        notify "✅ google-services.json regenerado desde Infisical"
    elif [ $STATUS -eq 2 ]; then
        notify "⚠️  $GOOGLE_SECRET_KEY no está en Infisical; uso el fichero local si existe."
    else
        notify "⚠️  Infisical no disponible o fallo de lectura; uso el fichero local si existe."
    fi
    if [ $STATUS -ne 0 ]; then
        if [ -f "$GOOGLE_FILE" ]; then
            notify "✅ google-services.json ya existe localmente; continúo (fail-open)."
            return 0
        fi
        notify "❌ google-services.json ausente y sin acceso a Infisical. Abortando."
        exit 1
    fi

    # Exportar EXPO_PUBLIC_* solo si no están ya en el entorno
    if [ -f "$ENV_TMP" ]; then
        while IFS='=' read -r k v; do
            [ -z "$k" ] && continue
            if eval "[ -z \"\${$k+x}\" ]"; then
                export "$k=$v"
                notify "ℹ️  Exportado $k (sin mostrar valor)"
            else
                notify "ℹ️  $k ya estaba en el entorno; no se sobreescribe"
            fi
        done < "$ENV_TMP"
        rm -f "$ENV_TMP"
    fi
    return 0
}

# Uso directo (build local/EAS): deja google-services.json materializado.
load_secrets
