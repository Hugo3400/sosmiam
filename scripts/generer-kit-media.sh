#!/usr/bin/env bash
# Refait les fichiers du kit média des ambassadeurs (apps/site-web/kit-media/) à partir des dessins de la marque.
# 1. lit la liste des fichiers sur le serveur de développement du site (/rendu-kit/liste, tirée de src/contenus/kit-media.ts) ;
# 2. capture chaque PNG à sa taille exacte avec le Chrome sans écran de Playwright (fond transparent pour les logos, la
#    mascotte et les badges) et enregistre chaque SVG tel que la route le renvoie ; vérifie la taille de chaque image ;
# 3. refait kit-media-sos-miam.zip : tous les fichiers, et a-lire.txt (les règles et les textes prêts à poster).
# Tout est fabriqué à part, puis remplace l'ancien kit d'un coup : si une étape échoue, rien ne change.
# Il faut que le serveur de développement tourne (pm2 « sos-miam-site-dev », 127.0.0.1:5190) : la route /rendu-kit
# n'existe pas en ligne. Les fichiers produits sont commités avec le site.
# Usage : npm run site:kit-media   (ou bash scripts/generer-kit-media.sh)
# Réglages possibles : ADRESSE_SITE (un autre serveur de développement), CHROME (un autre Chrome sans écran).
set -euo pipefail

racine="$(cd "$(dirname "$0")/.." && pwd)"
kit="$racine/apps/site-web/kit-media"
site="${ADRESSE_SITE:-http://127.0.0.1:5190}"
readonly ZIP="kit-media-sos-miam.zip"
readonly DOSSIERS=(logos mascotte badges visuels)

for outil in curl file zip; do
  command -v "$outil" >/dev/null || { echo "❌ Il manque la commande « $outil » (apt install $outil)."; exit 1; }
done

chrome="${CHROME:-}"
if [ -z "$chrome" ]; then
  chrome="$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | sort -V | tail -n 1 || true)"
fi
if [ ! -x "$chrome" ]; then
  echo "❌ Chrome sans écran introuvable : installe-le (npx playwright install chromium-headless-shell) ou donne son chemin dans CHROME."
  exit 1
fi

if ! liste="$(curl -fsS "$site/rendu-kit/liste")"; then
  echo "❌ $site/rendu-kit/liste ne répond pas : lance le serveur de développement (npm run site:dev)."
  exit 1
fi

travail="$(mktemp -d)"
trap 'rm -rf "$travail"' EXIT
nouveau="$travail/kit"

nombre=0
while read -r format visuel chemin largeur hauteur; do
  [ -n "$format" ] || continue
  mkdir -p "$nouveau/$(dirname "$chemin")"
  case "$format" in
    svg)
      curl -fsS "$site/rendu-kit/$visuel.svg" -o "$nouveau/$chemin"
      ;;
    png)
      # La page doit exister (sinon on capturerait une page d'erreur à la bonne taille)
      if ! curl -fsS -o /dev/null "$site/rendu-kit/$visuel"; then
        echo "❌ $site/rendu-kit/$visuel ne s'affiche pas (voir le journal du serveur de développement)."
        exit 1
      fi
      # Fenêtre à la taille exacte, sans barres de défilement, fond transparent par défaut ; le temps virtuel laisse
      # les polices arriver (la page les attend : jamais de police de secours)
      "$chrome" --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 \
        --window-size="$largeur,$hauteur" --virtual-time-budget=15000 --screenshot="$nouveau/$chemin" \
        "$site/rendu-kit/$visuel" </dev/null >/dev/null 2>&1
      if ! file -b "$nouveau/$chemin" 2>/dev/null | grep -q "PNG image data, $largeur x $hauteur,"; then
        echo "❌ $chemin : l'image n'a pas la taille attendue ($largeur × $hauteur)."
        exit 1
      fi
      ;;
    *)
      echo "❌ Ligne inattendue dans la liste : $format $visuel $chemin"
      exit 1
      ;;
  esac
  echo "✓ $chemin"
  nombre=$((nombre + 1))
done <<< "$liste"

# Le zip : les règles d'abord, puis les fichiers dans l'ordre alphabétique, tous à la même date (un zip refait sans
# changement d'image reste identique, donc pas de fausse modification dans git)
curl -fsS "$site/rendu-kit/a-lire.txt" -o "$nouveau/a-lire.txt"
(
  cd "$nouveau"
  find a-lire.txt "${DOSSIERS[@]}" -exec touch -h -t 202601010000 {} +
  { echo a-lire.txt; find "${DOSSIERS[@]}" -type f | LC_ALL=C sort; } | zip -q -X -D "$ZIP" -@
)
rm "$nouveau/a-lire.txt"

# Remplacement d'un coup (dossiers et zip) ; le reste du dossier kit-media n'est pas touché
mkdir -p "$kit"
for dossier in "${DOSSIERS[@]}"; do
  rm -rf "$kit/$dossier"
  mv "$nouveau/$dossier" "$kit/$dossier"
done
mv -f "$nouveau/$ZIP" "$kit/$ZIP"

echo "✅ Kit média refait : $nombre fichiers et $ZIP ($(du -h "$kit/$ZIP" | cut -f1)) dans apps/site-web/kit-media/."
