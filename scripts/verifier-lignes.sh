#!/usr/bin/env bash
# Vérifie la règle du projet : aucun fichier de code ne dépasse 700 lignes.
# Prévient dès 500 lignes, pour découper avant d'atteindre la limite.
# Usage : npm run verifier:lignes   (ou bash scripts/verifier-lignes.sh)
set -euo pipefail

LIMITE=700
ALERTE=500
racine="$(cd "$(dirname "$0")/.." && pwd)"
trop_long=0

while IFS= read -r -d '' fichier; do
  lignes=$(wc -l < "$fichier")
  chemin="${fichier#"$racine"/}"
  if (( lignes > LIMITE )); then
    echo "❌ $chemin : $lignes lignes (maximum $LIMITE)"
    trop_long=1
  elif (( lignes > ALERTE )); then
    echo "⚠️  $chemin : $lignes lignes, pense à le découper"
  fi
done < <(find "$racine/apps" "$racine/packages" "$racine/scripts" -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \
     -o -name "*.css" -o -name "*.prisma" -o -name "*.sh" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/build/*" -not -path "*/versions/*" -not -path "*/dist/*" \
  -not -path "*/.react-router/*" -not -path "*/client-genere/*" -not -path "*/.expo/*" -not -path "*/prisma/migrations/*" \
  -print0)

if (( trop_long )); then
  echo "Découpe ces fichiers avant de continuer."
  exit 1
fi
echo "✅ Aucun fichier au-dessus de $LIMITE lignes."
