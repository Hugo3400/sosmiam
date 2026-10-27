import type { ArticleActus } from "../../../../../packages/commun/src/types/actus.ts";
import type { FiltresActus } from "../../types/actus.ts";
import { ecrireIdentifiantVille } from "../page-lieux/ecrire-identifiant-ville.ts";

export function filtrerArticlesActus<Article extends Pick<ArticleActus<unknown>, "rubrique" | "lieux">>(articles: readonly Article[], filtres: FiltresActus): Article[] {
  return articles.filter(
    (article) =>
      (filtres.rubrique === null || article.rubrique === filtres.rubrique) &&
      (filtres.ville === null || article.lieux.some((lieu) => ecrireIdentifiantVille(lieu.ville) === filtres.ville)),
  );
}
