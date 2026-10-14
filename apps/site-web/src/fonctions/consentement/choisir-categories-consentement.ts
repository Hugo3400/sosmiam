import { categoriesConsentement, partenaireApercu, type CategorieConsentement } from "~/contenus/cookies-consentement";

/**
 * Les catégories de cookies de la page. En aperçu (« ?apercu-cookies », apercu.sosmiam.fr), la catégorie « publicite »
 * devient active avec un partenaire imaginaire, pour voir le bandeau ; sinon, la liste telle quelle.
 */
export function choisirCategoriesConsentement(apercu: boolean): CategorieConsentement[] {
  if (!apercu) return categoriesConsentement;
  return categoriesConsentement.map((categorie) =>
    categorie.id === "publicite" ? { ...categorie, active: true, partenaires: [partenaireApercu] } : categorie,
  );
}
