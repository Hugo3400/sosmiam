import { villesFrance, type VilleFrance } from "@sos-miam/commun/contenus/villes-france";

import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

const CHERCHEES_MAX = 5_000;

const parValeur = new Map<string, VilleFrance>();
const parNom = new Map<string, VilleFrance>();
for (const ville of villesFrance) {
  const valeur = normaliserRecherche(ville.valeur);
  const nom = normaliserRecherche(ville.nom);
  if (!parValeur.has(valeur)) parValeur.set(valeur, ville);
  if (!parNom.has(nom)) parNom.set(nom, ville);
}
const dejaCherchees = new Map<string, VilleFrance | null>();

/** La ville de France qui porte ce nom (sans tenir compte des accents ni des majuscules), ou null si elle n'est pas dans notre liste. */
export function trouverVilleFrance(nom: string): VilleFrance | null {
  const deja = dejaCherchees.get(nom);
  if (deja !== undefined) return deja;
  const cherche = normaliserRecherche(nom);
  const ville = cherche === "" ? null : (parValeur.get(cherche) ?? parNom.get(cherche) ?? null);
  if (dejaCherchees.size >= CHERCHEES_MAX) dejaCherchees.clear();
  dejaCherchees.set(nom, ville);
  return ville;
}
