import { estArticleActusAlcool } from "~/fonctions/actus/est-article-actus-alcool";
import { filtrerArticlesActus } from "~/fonctions/actus/filtrer-articles-actus";
import { listerVillesActus } from "~/fonctions/actus/lister-villes-actus";
import { trierArticlesActus } from "~/fonctions/actus/trier-articles-actus";
import { ARTICLES_ACTUS_EXEMPLE, type ArticleActusExemple } from "~/services/actus-exemple.server";
import type { ArticleActusSite, FiltresActus, PageActus } from "~/types/actus";

const retirerStatut = ({ statut: _, ...article }: ArticleActusExemple): ArticleActusSite => article;

function listerArticlesVisibles(): ArticleActusSite[] {
  const publies = ARTICLES_ACTUS_EXEMPLE.filter((article) => article.statut === "publie" && !estArticleActusAlcool(article));
  return trierArticlesActus(publies.map(retirerStatut));
}

export async function listerArticlesActus(filtres: FiltresActus): Promise<PageActus> {
  const visibles = listerArticlesVisibles();
  return { articles: filtrerArticlesActus(visibles, filtres), villes: listerVillesActus(visibles) };
}

export async function lireArticleActus(id: number): Promise<ArticleActusSite | null> {
  return listerArticlesVisibles().find((article) => article.id === id) ?? null;
}
