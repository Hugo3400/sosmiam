import type { CategorieFacultative } from "~/contenus/cookies-consentement";
import type { ChoixConsentement } from "~/types/consentement";

/**
 * Le bandeau s'affiche s'il y a au moins une catégorie à choisir (sinon ce serait un faux choix) et qu'une de ces
 * catégories n'a pas encore de réponse valable : pas de choix, choix expiré, ou version des partenaires changée.
 */
export function doitAfficherBandeau(aChoisir: CategorieFacultative[], choix: ChoixConsentement | null): boolean {
  return aChoisir.some((categorie) => choix?.reponses[categorie.id] === undefined);
}
