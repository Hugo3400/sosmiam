import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";
import { calculerAgeProfil } from "./calculer-age-profil.ts";
import { AGE_ROLES } from "./presenter-compte.ts";

/** « majeur » : âge connu d'au moins 18 ans, ou pas de date gardée ; « mineur » : âge connu sous 18 ans ; « illisible » :
 * date gardée mais impossible à lire (clé absente ou fausse) */
export type MajoriteCompte = "majeur" | "mineur" | "illisible";

/**
 * Le rôle pro est-il permis à ce compte (rattachement, invitation d'équipe, routes /pro et /miam-safe/pro) ?
 * - sans date gardée : compte créé sur le site, qui a prouvé ses 18 ans à l'inscription → « majeur » ;
 * - date gardée et lisible : « mineur » si l'âge est sous 18 ans (une date impossible, jamais écrite par l'API, compte
 *   comme inconnue, comme dans presenterCompte) ;
 * - date gardée mais illisible : « illisible » (la route répond 503, on réessaiera ; jamais un refus définitif).
 */
export function lireMajoriteCompte(dateNaissanceChiffree: string | null, chiffrement: ChiffrementDonnees | null, maintenant: Date): MajoriteCompte {
  if (dateNaissanceChiffree === null) return "majeur";
  if (!chiffrement) return "illisible";
  let dateNaissance: string;
  try {
    dateNaissance = chiffrement.dechiffrer(dateNaissanceChiffree, "dateNaissance");
  } catch {
    return "illisible";
  }
  const age = calculerAgeProfil(dateNaissance, maintenant);
  return age !== null && age < AGE_ROLES ? "mineur" : "majeur";
}
