import type { ArticleActus } from "../../../../../packages/commun/src/types/actus.ts";
import type { VilleActus } from "../../types/actus.ts";
import { ecrireIdentifiantVille } from "../page-lieux/ecrire-identifiant-ville.ts";

export function listerVillesActus(articles: readonly Pick<ArticleActus<unknown>, "lieux">[]): VilleActus[] {
  const villes = new Map<string, string>();
  for (const { ville } of articles.flatMap((article) => article.lieux)) {
    const identifiant = ecrireIdentifiantVille(ville);
    if (identifiant && !villes.has(identifiant)) villes.set(identifiant, ville);
  }
  return [...villes].map(([identifiant, nom]) => ({ identifiant, nom })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
