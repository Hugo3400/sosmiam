#!/usr/bin/env bash
# Refait les fichiers du kit média pro des ambassadeurs certifiés (apps/site-web/kit-media-pro/) : l'affiche A4 et le
# flyer A6 recto verso, en PNG (300 dpi) et en PDF à imprimer.
# 1. lit la liste des fichiers sur le serveur de développement du site (/rendu-kit-pro/liste, tirée de
#    src/contenus/kit-media-pro.ts) ;
# 2. capture chaque PNG à sa taille exacte, et imprime chaque PDF au format du papier (A4 ou A6, sans marge, fonds
#    compris) avec le Chrome sans écran de Playwright ; vérifie la taille de chaque image et de chaque page ;
# 3. refait kit-media-pro-sos-miam.zip : tous les fichiers, et a-lire.txt (l'usage, le mot du comptoir, le mail type,
#    les textes et les règles).
# Tout est fabriqué à part, puis remplace l'ancien kit d'un coup : si une étape échoue, rien ne change.
# Il faut que le serveur de développement tourne (pm2 « sos-miam-site-dev », 127.0.0.1:5190) : la route /rendu-kit-pro
# n'existe pas en ligne. Les fichiers produits sont commités avec le site.
# Usage : npm run site:kit-media-pro   (ou bash scripts/generer-kit-media-pro.sh)
# Réglages possibles : ADRESSE_SITE (un autre serveur de développement), CHROME (un autre Chrome sans écran).
set -euo pipefail

racine="$(cd "$(dirname "$0")/.." && pwd)"
kit="$racine/apps/site-web/kit-media-pro"
site="${ADRESSE_SITE:-http://127.0.0.1:5190}"
readonly ZIP="kit-media-pro-sos-miam.zip"

for outil in curl file zip python3; do
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

if ! liste="$(curl -fsS "$site/rendu-kit-pro/liste")"; then
  echo "❌ $site/rendu-kit-pro/liste ne répond pas : lance le serveur de développement (npm run site:dev)."
  exit 1
fi

travail="$(mktemp -d)"
trap 'rm -rf "$travail"' EXIT
nouveau="$travail/kit"
mkdir -p "$nouveau"

# Vérifie un PDF : son nombre de pages et la taille de chacune, à 1 mm près (Chrome arrondit un peu)
verifier_pdf() {
  python3 - "$1" "$2" "$3" "$4" <<'PY'
import re, sys
chemin, pages, largeur_mm, hauteur_mm = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
contenu = open(chemin, "rb").read()
if not contenu.startswith(b"%PDF"):
    sys.exit(1)
tailles = re.findall(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]", contenu)
mm = lambda points: float(points) * 25.4 / 72
ok = len(tailles) == pages and all(abs(mm(l) - largeur_mm) < 1 and abs(mm(h) - hauteur_mm) < 1 for l, h in tailles)
sys.exit(0 if ok else 1)
PY
}

nombre=0
while read -r format visuel chemin a b c; do
  [ -n "$format" ] || continue
  # La page doit exister (sinon on capturerait une page d'erreur)
  parametres=""
  [ "$format" = "pdf" ] && parametres="?impression=1"
  if ! curl -fsS -o /dev/null "$site/rendu-kit-pro/$visuel$parametres"; then
    echo "❌ $site/rendu-kit-pro/$visuel$parametres ne s'affiche pas (voir le journal du serveur de développement)."
    exit 1
  fi
  case "$format" in
    png)
      # Fenêtre à la taille exacte, sans barres de défilement ; le temps virtuel laisse les polices arriver (la page
      # les attend : jamais de police de secours)
      "$chrome" --no-sandbox --hide-scrollbars --force-device-scale-factor=1 --window-size="$a,$b" \
        --virtual-time-budget=15000 --screenshot="$nouveau/$chemin" "$site/rendu-kit-pro/$visuel" </dev/null >/dev/null 2>&1
      if ! file -b "$nouveau/$chemin" 2>/dev/null | grep -q "PNG image data, $a x $b,"; then
        echo "❌ $chemin : l'image n'a pas la taille attendue ($a × $b)."
        exit 1
      fi
      ;;
    pdf)
      # Le format du papier vient de la page (@page), sans en-tête ni pied de page du navigateur
      "$chrome" --no-sandbox --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf="$nouveau/$chemin" \
        "$site/rendu-kit-pro/$visuel$parametres" </dev/null >/dev/null 2>&1
      if ! verifier_pdf "$nouveau/$chemin" "$a" "$b" "$c"; then
        echo "❌ $chemin : le PDF n'a pas $a page(s) de $b × $c mm."
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

# Le zip : a-lire.txt d'abord, puis les fichiers dans l'ordre alphabétique, tous à la même date (un zip refait sans
# changement reste identique, donc pas de fausse modification dans git)
curl -fsS "$site/rendu-kit-pro/a-lire.txt" -o "$nouveau/a-lire.txt"
(
  cd "$nouveau"
  find . -type f -exec touch -h -t 202601010000 {} +
  { echo a-lire.txt; find . -type f \( -name "*.png" -o -name "*.pdf" \) -printf "%P\n" | LC_ALL=C sort; } | zip -q -X -D "$ZIP" -@
)
rm "$nouveau/a-lire.txt"

# Remplacement d'un coup
rm -rf "$kit"
mv "$nouveau" "$kit"

echo "✅ Kit média pro refait : $nombre fichiers et $ZIP ($(du -h "$kit/$ZIP" | cut -f1)) dans apps/site-web/kit-media-pro/."
