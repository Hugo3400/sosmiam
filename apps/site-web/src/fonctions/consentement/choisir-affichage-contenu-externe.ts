import type { AffichageContenuExterne } from "~/types/consentement";

/**
 * Ce que montre ContenuExterne : la vignette tant qu'il n'y a ni accord pour la catégorie ni « Afficher quand même » ;
 * avec l'un des deux, le contenu, mais seulement dans le navigateur (« attente » au rendu serveur). Ainsi, aucune page
 * HTML, même gardée en cache, ne contient l'iframe ou le script d'un autre site.
 */
export function choisirAffichageContenuExterne(etat: { consenti: boolean; afficheUneFois: boolean; navigateur: boolean }): AffichageContenuExterne {
  if (!etat.consenti && !etat.afficheUneFois) return "vignette";
  return etat.navigateur ? "contenu" : "attente";
}
