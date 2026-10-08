import type { Publication } from "~/contenus/type-publication";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";

/**
 * Vrai si l'AUTEUR de la publication (le lieu, ou le créateur) fait partie des suivis donnés (clés de calculerCleSuivi) :
 * c'est la règle de l'onglet « Abonnements » du fil. La vidéo d'un créateur sur un lieu suivi n'y entre pas.
 */
export function estPublieeParSuivi(publication: Publication, cles: ReadonlySet<string>): boolean {
  return cles.has(calculerCleSuivi(publication.auteur, publication.lieuId));
}
