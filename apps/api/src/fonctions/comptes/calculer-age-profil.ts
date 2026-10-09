// L'âge d'un profil de l'app avec la règle de packages/commun (calculerAge), jamais recopiée : on lui donne le jour qu'il
// est à Paris (à 0 h 30 à Paris, c'est déjà le lendemain, même si l'heure universelle dit encore la veille).
import { calculerAge } from "../../../../../packages/commun/src/regles/calculer-age.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";
import { calculerAgeAParis } from "./calculer-age-a-paris.ts";

/**
 * Âge en années pleines d'après une date de naissance « AAAA-MM-JJ », au jour de Paris. Null si la date est mal écrite,
 * n'existe pas (30 février), est dans le futur ou avant 1900 (mêmes refus que calculerAgeAParis).
 */
export function calculerAgeProfil(dateNaissance: string, maintenant: Date = new Date()): number | null {
  if (calculerAgeAParis(dateNaissance, maintenant) === null) return null;
  const [annee, mois, jour] = calculerClesPeriodes(maintenant).jour.split("-").map(Number) as [number, number, number];
  // calculerAge lit l'année, le mois et le jour à l'heure locale du serveur : midi de ce jour-là, à l'heure locale
  return calculerAge(dateNaissance, new Date(annee, mois - 1, jour, 12));
}
