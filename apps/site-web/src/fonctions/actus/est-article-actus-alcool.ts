import { parleDAlcool } from "../../../../../packages/commun/src/fonctions/prevention/parle-d-alcool.ts";
import type { ArticleActus } from "../../../../../packages/commun/src/types/actus.ts";

type ArticleLu = Pick<ArticleActus<unknown>, "alcool" | "lieux" | "titre" | "accroche" | "paragraphes" | "citation" | "reponsesLieux">;

export function estArticleActusAlcool(article: ArticleLu): boolean {
  if (article.alcool || article.lieux.some((lieu) => lieu.type === "bar")) return true;
  return parleDAlcool([article.titre, article.accroche, article.citation, ...article.paragraphes, ...article.lieux.map((lieu) => lieu.nom), ...article.reponsesLieux.map((reponse) => reponse.texte)].filter(Boolean).join(" · "));
}
