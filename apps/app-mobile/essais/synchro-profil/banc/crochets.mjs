// Les crochets de chargement du banc (branchés par enregistrer.mjs) : les alias de l'app (~/ et @sos-miam/commun/, comme
// dans tsconfig.json), le TypeScript lu tel quel, les doublures des modules du téléphone (dossier doublures/), et une
// garde : aucun autre paquet ne se charge. Un module natif d'Expo ou de React Native qui arriverait par un import fait
// échouer le banc tout de suite, avec son nom, au lieu de planter plus loin.
//
// Pour vérifier que le banc attrape un défaut sans toucher au vrai fichier (un processus commite le dépôt tout seul) :
// ESSAIS_SYNCHRO_REMPLACER="~/services/synchro-profil=/chemin/de/la/copie.ts" charge la copie à sa place (plusieurs
// remplacements : séparés par « ; »).
import { statSync } from "node:fs";
import { isBuiltin } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP = new URL("../../../src/", import.meta.url);
const COMMUN = new URL("../../../../../packages/commun/src/", import.meta.url);
const DOUBLURES = new URL("../doublures/", import.meta.url);

/** Les modules du téléphone (stockage) remplacés par une doublure */
const DOUBLES = {
  "@react-native-async-storage/async-storage": "async-storage.mjs",
  "~/stockage/profil-local": "profil-local.mjs",
  "~/stockage/avatar-local": "avatar-local.mjs",
};

function lireRemplacements() {
  const remplacements = new Map();
  for (const paire of (process.env.ESSAIS_SYNCHRO_REMPLACER ?? "").split(";")) {
    if (!paire.trim()) continue;
    const egal = paire.indexOf("=");
    if (egal <= 0) throw new Error(`Banc : ESSAIS_SYNCHRO_REMPLACER mal écrit (« ${paire} ») : module=chemin`);
    remplacements.set(paire.slice(0, egal).trim(), pathToFileURL(paire.slice(egal + 1).trim()).href);
  }
  return remplacements;
}
const REMPLACEMENTS = lireRemplacements();

const estUnFichier = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

/** Le fichier d'un alias : tel quel s'il a déjà son extension, sinon en .ts puis en .tsx */
function trouverFichier(base) {
  for (const extension of ["", ".ts", ".tsx"]) {
    const url = new URL(base.href + extension);
    if (estUnFichier(url)) return url.href;
  }
  return null;
}

/** Un nom de paquet (« expo-crypto », « react-native »…), pas un chemin ni une adresse */
const estUnPaquet = (specifier) => !/^(\.{1,2}\/|\/|[a-z][a-z0-9+.-]*:)/i.test(specifier);

export async function resolve(specifier, context, next) {
  const remplacement = REMPLACEMENTS.get(specifier);
  if (remplacement) return { url: remplacement, shortCircuit: true };
  if (DOUBLES[specifier]) return { url: new URL(DOUBLES[specifier], DOUBLURES).href, shortCircuit: true };
  let base = null;
  if (specifier.startsWith("~/")) base = new URL(specifier.slice("~/".length), APP);
  else if (specifier.startsWith("@sos-miam/commun/")) base = new URL(specifier.slice("@sos-miam/commun/".length), COMMUN);
  if (base) {
    const fichier = trouverFichier(base);
    if (!fichier) throw new Error(`Banc : « ${specifier} » introuvable (importé par ${context.parentURL})`);
    return { url: fichier, shortCircuit: true };
  }
  if (estUnPaquet(specifier) && !isBuiltin(specifier)) {
    throw new Error(
      `Banc : le paquet « ${specifier} » (importé par ${context.parentURL}) ne se charge pas ici. ` +
        "Un module du téléphone ? Ajoute sa doublure dans doublures/ et une ligne à DOUBLES (banc/crochets.mjs).",
    );
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("file:") && url.endsWith(".ts")) return next(url, { ...context, format: "module-typescript" });
  return next(url, context);
}
