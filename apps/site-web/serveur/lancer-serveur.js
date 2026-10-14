// Serveur de production du site (`npm start` dans apps/site-web, pm2 « sos-miam-site », derrière nginx), à la place de
// react-router-serve depuis l'audit du 14 octobre 2026. Il fait exactement ce que fait react-router-serve 8.4
// (node_modules/@react-router/serve/dist/cli.js) : compression, sans en-tête « X-Powered-By », /assets en cache immuable
// d'un an, le reste de build/client sans cache (max-age=0), public/ en cache d'une heure, /.well-known, puis React Router
// (createRequestHandler de @react-router/express, mode « production » par défaut), PORT et HOST.
// Une seule différence : le journal (journaliser-requetes.js) n'écrit que la méthode, le chemin sans paramètres ni
// fragment, le statut et la durée. Pas repris, inutiles ici : les builds RSC et la recherche d'un port libre sans PORT.
// Usage (depuis apps/site-web, comme le script start) : PORT=5191 node serveur/lancer-serveur.js ./build/server/index.js
// « build » est un lien vers la version en ligne (versions/<date>, scripts/deployer-site.sh) : le build donne lui-même son
// dossier client (assetsBuildDirectory, relatif à apps/site-web), comme avec react-router-serve.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import sourceMapSupport from "source-map-support";

import { journaliserRequetes } from "./journaliser-requetes.js";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

// Les erreurs pointent vers le code source (fichiers .map du build), comme avec react-router-serve
sourceMapSupport.install({
  retrieveSourceMap(source) {
    if (!source.startsWith("file://")) return null;
    const carte = `${url.fileURLToPath(source)}.map`;
    return fs.existsSync(carte) ? { url: source, map: fs.readFileSync(carte, "utf8") } : null;
  },
});

/** « /assets » pour une adresse publique « / » (ou « https://…/ ») */
function lireCheminExpress(adressePublique) {
  let chemin;
  try {
    chemin = new URL(adressePublique).pathname;
  } catch {
    chemin = adressePublique;
  }
  return chemin.startsWith("/") ? chemin : `/${chemin}`;
}

const lu = Number(process.env.PORT);
const port = process.env.PORT === undefined || Number.isNaN(lu) ? 3000 : lu;
const cheminBuild = process.argv[2];
if (!cheminBuild) {
  console.error("\n  Usage : node serveur/lancer-serveur.js <build du serveur>, par exemple ./build/server/index.js");
  process.exit(1);
}
const build = await import(url.pathToFileURL(path.resolve(cheminBuild)).href);

const application = express();
application.disable("x-powered-by");
application.use(compression());
const cheminPublic = lireCheminExpress(build.publicPath);
application.use(
  path.posix.join(cheminPublic, "assets"),
  express.static(path.join(build.assetsBuildDirectory, "assets"), { immutable: true, maxAge: "1y" }),
);
application.use(cheminPublic, express.static(build.assetsBuildDirectory));
application.use(express.static("public", { maxAge: "1h" }));
application.use("/.well-known", express.static(path.join(build.assetsBuildDirectory, ".well-known")));
application.use(journaliserRequetes());
application.all("/{*splat}", createRequestHandler({ build, mode: process.env.NODE_ENV }));

const quandPret = (erreur) => {
  if (erreur) throw erreur;
  console.log(`[serveur du site] http://${process.env.HOST || "localhost"}:${port}`);
};
const serveur = process.env.HOST ? application.listen(port, process.env.HOST, quandPret) : application.listen(port, quandPret);

// Arrêt propre (pm2 reload) : les requêtes en cours se terminent
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => serveur.close((erreur) => erreur && console.error(erreur)));
}
