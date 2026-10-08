#!/usr/bin/env bash
# Construit l'installateur Windows du logiciel de gestion depuis le serveur (compilation croisée, comme TabulaDB),
# le signe pour les mises à jour automatiques, et le publie :
#   - apps/logiciel-gestion/installateur/ (non commité) : pour une première installation, clic droit → « Télécharger » ;
#   - /var/lib/sos-miam/mises-a-jour/ (+ latest.json) : les logiciels déjà installés se mettent à jour tout seuls.
# Usage : npm run gestion:installateur   (depuis /var/www/sos-miam). Avant : augmenter « version » dans
# src-tauri/tauri.conf.json, package.json et src-tauri/Cargo.toml. Notes de version facultatives : NOTES="…".
#
# Prérequis, déjà en place pour TabulaDB : rustup (cible x86_64-pc-windows-msvc), cargo-xwin, clang, lld, nsis.
# Le CLI Tauri reste en 2.11.5 : les versions suivantes demandent un NSIS plus récent que celui de Debian 12.
# Clé de signature des mises à jour : /root/sos-miam-secrets/cle-maj-logiciel.key (sa clé publique est dans
# tauri.conf.json). Elle n'est JAMAIS dans l'environnement de la compilation : l'installateur est signé après, à part.
set -euo pipefail

DOSSIER="$(cd "$(dirname "$0")/.." && pwd)"
CIBLE=x86_64-pc-windows-msvc
CLE="${CLE_MAJ:-/root/sos-miam-secrets/cle-maj-logiciel.key}"
DOSSIER_MAJ="${DOSSIER_MAJ:-/var/lib/sos-miam/mises-a-jour}"
ADRESSE_MAJ="${ADRESSE_MAJ:-https://sosmiam.fr/api-gestion/maj/fichiers}"
export PATH="$HOME/.cargo/bin:$PATH"

cd "$DOSSIER"
[ -d node_modules ] || npm ci
npm run typecheck
npm test
npx tauri build --runner cargo-xwin --target "$CIBLE"

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
NOM="SOS-Miam-Gestion-${VERSION}-installateur.exe"
mkdir -p installateur
cp "src-tauri/target/$CIBLE/release/bundle/nsis/SOS Miam Gestion_${VERSION}_x64-setup.exe" "installateur/$NOM"

# Signature des mises à jour, dans un environnement vidé (seuls HOME et PATH), la clé lue dans son fichier
env -i HOME="$HOME" PATH="$PATH" TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
  npx tauri signer sign -f "$CLE" "installateur/$NOM" </dev/null >/dev/null
[ -s "installateur/$NOM.sig" ] || { echo "Signature de mise à jour ratée." >&2; exit 1; }

# Publication : installateur, puis manifeste (écrit en dernier : un logiciel ne voit jamais une version incomplète)
install -d -m 700 "$DOSSIER_MAJ"
install -m 600 "installateur/$NOM" "$DOSSIER_MAJ/$NOM"
VERSION="$VERSION" NOM="$NOM" ADRESSE="$ADRESSE_MAJ" NOTES="${NOTES:-}" SIG="$(cat "installateur/$NOM.sig")" node -e '
const { writeFileSync, renameSync } = require("node:fs");
const manifeste = {
  version: process.env.VERSION,
  notes: process.env.NOTES,
  pub_date: new Date().toISOString(),
  platforms: { "windows-x86_64": { signature: process.env.SIG, url: `${process.env.ADRESSE}/${process.env.NOM}` } },
};
writeFileSync(process.argv[1] + ".tmp", JSON.stringify(manifeste, null, 2), { mode: 0o600 });
renameSync(process.argv[1] + ".tmp", process.argv[1]);
' "$DOSSIER_MAJ/latest.json"
# On ne garde que les 3 derniers installateurs publiés
ls -1t "$DOSSIER_MAJ"/SOS-Miam-Gestion-*-installateur.exe | tail -n +4 | xargs -r rm -f

echo "Installateur prêt : $DOSSIER/installateur/$NOM"
echo "Mise à jour publiée : les logiciels installés la proposeront à leur prochaine connexion."
echo "Empreinte SHA-256 : $(sha256sum "installateur/$NOM" | cut -d' ' -f1)"
