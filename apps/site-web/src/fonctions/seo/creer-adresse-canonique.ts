// Aucun import « ~/… » ici : le test (tests/indexation.test.ts) lance ce fichier directement avec Node.

/**
 * L'adresse officielle (canonique) d'une page : le site (« https://sosmiam.fr », sans « / » final) suivi du chemin, sans
 * paramètres ni « / » final (sauf l'accueil, « https://sosmiam.fr/ »).
 */
export function creerAdresseCanonique(site: string, chemin: string, requete = ""): string {
  const sansParametres = chemin.split(/[?#]/)[0] || "/";
  const propre = sansParametres === "/" ? "/" : sansParametres.replace(/\/+$/, "") || "/";
  return `${site.replace(/\/+$/, "")}${propre}${requete ? `?${requete}` : ""}`;
}
