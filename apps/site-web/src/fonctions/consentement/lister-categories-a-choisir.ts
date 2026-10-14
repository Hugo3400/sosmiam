import type { CategorieConsentement, CategorieFacultative } from "~/contenus/cookies-consentement";

/** Les catégories sur lesquelles on demande un choix : facultatives ET actives (un traceur existe vraiment). */
export function listerCategoriesAChoisir(categories: CategorieConsentement[]): CategorieFacultative[] {
  return categories.filter((categorie): categorie is CategorieFacultative => categorie.id !== "necessaires" && categorie.active);
}
