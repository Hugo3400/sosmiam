#!/usr/bin/env bash
# Met en ligne la dernière version du site sur l'aperçu (https://apercu.sosmiam.fr).
# 1. vérifie les types et la règle des 700 lignes ;
# 2. construit le site dans son propre dossier (apps/site-web/versions/<date>) : le site en ligne n'est jamais
#    vidé pendant la construction, et si elle échoue, rien ne change ;
# 3. fait pointer le lien apps/site-web/build vers cette version, puis relance le serveur pm2 « sos-miam-site »
#    (127.0.0.1:5191, derrière nginx) ; on garde les 3 dernières versions.
# Usage : npm run site:deployer   (ou bash scripts/deployer-site.sh)
# Retour arrière : cd apps/site-web && ln -sfn versions/<précédente> build-lien && mv -T build-lien build && pm2 reload sos-miam-site
set -euo pipefail

readonly NOM_PM2="sos-miam-site"
readonly PORT=5191
racine="$(cd "$(dirname "$0")/.." && pwd)"
site="$racine/apps/site-web"
version="versions/$(date +%Y%m%d-%H%M%S)"

cd "$racine"
npm run site:verifier
DOSSIER_BUILD="$version" npm run site:build

# Bascule d'un coup : « build » devient un lien vers la nouvelle version
cd "$site"
[ -L build ] || rm -rf build
ln -sfn "$version" build-lien
mv -T build-lien build
cd "$racine"

if pm2 describe "$NOM_PM2" >/dev/null 2>&1; then
  pm2 reload "$NOM_PM2"
else
  # HOST : le serveur n'écoute qu'en local, seul nginx lui parle
  HOST=127.0.0.1 pm2 start npm --name "$NOM_PM2" --cwd "$site" -- run start
fi

# Le serveur doit répondre avant qu'on annonce la mise en ligne
for _ in $(seq 1 20); do
  if curl -fs -o /dev/null "http://127.0.0.1:$PORT/"; then
    ls -1d "$site"/versions/* | head -n -3 | xargs -r rm -rf
    echo "✅ Version $version en ligne sur https://apercu.sosmiam.fr (pm2 : $NOM_PM2, 127.0.0.1:$PORT)."
    exit 0
  fi
  sleep 1
done
echo "❌ Le serveur ne répond pas : voir « pm2 logs $NOM_PM2 »."
exit 1
