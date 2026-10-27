import type { ArticleActus } from "@sos-miam/commun/types/actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { ADRESSE_API } from "~/services/adresse-api";

const source = (chemin: string) => ({ uri: chemin.startsWith("/") ? `${ADRESSE_API}${chemin}` : chemin });

export function convertirArticleActus(article: ArticleActus): ArticleActusAffiche {
  return { ...article, couverture: source(article.couverture), photos: article.photos.map(source) };
}
