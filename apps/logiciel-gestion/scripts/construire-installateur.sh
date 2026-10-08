#!/usr/bin/env bash
# Construit l'installateur Windows du logiciel de gestion depuis le serveur (compilation croisée, comme TabulaDB),
# et le dépose dans apps/logiciel-gestion/installateur/ (non commité) : clic droit → « Télécharger » dans VS Code.
# Usage : npm run gestion:installateur   (depuis /var/www/sos-miam)
#
# Prérequis, déjà en place sur le serveur pour TabulaDB : rustup avec la cible x86_64-pc-windows-msvc, cargo-xwin,
# clang, lld et nsis. Le CLI Tauri est fixé à 2.11.5 dans package.json : les versions suivantes demandent un NSIS plus
# récent que celui de Debian 12 (3.08, sans Win/RestartManager.nsh).
# Pas de mise à jour automatique : pour une nouvelle version, on augmente « version » dans src-tauri/tauri.conf.json,
# on reconstruit, et on relance l'installateur sur le PC (il remplace l'ancienne version, la clé du poste est gardée).
set -euo pipefail

DOSSIER="$(cd "$(dirname "$0")/.." && pwd)"
CIBLE=x86_64-pc-windows-msvc
export PATH="$HOME/.cargo/bin:$PATH"

cd "$DOSSIER"
[ -d node_modules ] || npm ci
npm run typecheck
npm test
npx tauri build --runner cargo-xwin --target "$CIBLE"

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
SOURCE="src-tauri/target/$CIBLE/release/bundle/nsis/SOS Miam Gestion_${VERSION}_x64-setup.exe"
mkdir -p installateur
cp "$SOURCE" "installateur/SOS-Miam-Gestion-${VERSION}-installateur.exe"
echo "Installateur prêt : $DOSSIER/installateur/SOS-Miam-Gestion-${VERSION}-installateur.exe"
echo "Empreinte SHA-256 (à comparer après le téléchargement) :"
sha256sum "installateur/SOS-Miam-Gestion-${VERSION}-installateur.exe" | cut -d' ' -f1
