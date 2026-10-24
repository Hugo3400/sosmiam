#!/usr/bin/env bash
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$ICI/../.." && pwd)"
export PORT_API="${PORT_API:-5198}" PORT_PILOTE="${PORT_PILOTE:-5199}" PORT_VITE="${PORT_VITE:-5197}"
JOURNAUX="$(mktemp -d)"
PIDS=()
arreter() {
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  rm -rf "$JOURNAUX"
}
trap arreter EXIT

[ -d "$ICI/node_modules/playwright-core" ] || npm ci --prefix "$ICI" --no-audit --no-fund >/dev/null

cd "$RACINE/apps/api"
env -u DATABASE_URL ORIGINES_GESTION="http://127.0.0.1:$PORT_VITE" node --experimental-strip-types "$ICI/banc-api.ts" >"$JOURNAUX/api.log" 2>&1 &
PIDS+=($!)
cd "$RACINE/apps/logiciel-gestion"
VITE_ADRESSE_API="http://127.0.0.1:$PORT_API/api-gestion" node node_modules/vite/bin/vite.js --port "$PORT_VITE" --strictPort >"$JOURNAUX/vite.log" 2>&1 &
PIDS+=($!)

for _ in $(seq 1 120); do
  if grep -q "pilote sur" "$JOURNAUX/api.log" && grep -q "Local" "$JOURNAUX/vite.log"; then break; fi
  if ! kill -0 "${PIDS[0]}" 2>/dev/null || ! kill -0 "${PIDS[1]}" 2>/dev/null; then
    echo "Le banc n'a pas démarré :" >&2; cat "$JOURNAUX/api.log" "$JOURNAUX/vite.log" >&2; exit 1
  fi
  node -e "setTimeout(() => {}, 250)"
done

cd "$ICI"
node parcourir-ecrans.mjs
