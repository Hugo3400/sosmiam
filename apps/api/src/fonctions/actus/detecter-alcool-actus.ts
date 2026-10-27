import { parleDAlcool } from "../../../../../packages/commun/src/fonctions/prevention/parle-d-alcool.ts";
import type { ArticleEnvoyeActus } from "../../../../../packages/commun/src/types/actus.ts";

export function detecterAlcoolActus(article: ArticleEnvoyeActus, typesLieux: readonly string[]): boolean {
  if (typesLieux.includes("bar")) return true;
  return [article.titre, article.accroche, article.citation ?? "", ...article.paragraphes].some((texte) => parleDAlcool(texte));
}
