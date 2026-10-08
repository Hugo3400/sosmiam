import { readFileSync } from "node:fs";

import { indexerCommunes, type DonneesCommunes, type IndexCommunes } from "./indexer-communes.ts";

/** Communes de France, refaites chaque année par npm run api:communes (scripts/preparer-communes.ts) */
const FICHIER_COMMUNES = new URL("../../donnees/communes.json", import.meta.url);

let index: IndexCommunes | undefined;

/**
 * L'index des communes, préparé à la première demande puis gardé en mémoire : le fichier n'est lu qu'une fois par
 * lancement de l'API (environ 2 Mo, une fraction de seconde), et jamais si personne ne cherche de commune.
 */
export function chargerIndexCommunes(): IndexCommunes {
  index ??= indexerCommunes(JSON.parse(readFileSync(FICHIER_COMMUNES, "utf8")) as DonneesCommunes);
  return index;
}
