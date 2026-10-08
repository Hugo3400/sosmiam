import { villesFrance, type VilleFrance } from "@sos-miam/commun/contenus/villes-france";

import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/** La ville de France qui porte ce nom (sans tenir compte des accents ni des majuscules), ou null si elle n'est pas dans notre liste. */
export function trouverVilleFrance(nom: string): VilleFrance | null {
  const cherche = normaliserRecherche(nom);
  if (cherche === "") return null;
  return villesFrance.find((v) => normaliserRecherche(v.valeur) === cherche) ?? villesFrance.find((v) => normaliserRecherche(v.nom) === cherche) ?? null;
}
