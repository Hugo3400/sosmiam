import type { ArticleActus } from "../../../../../packages/commun/src/types/actus.ts";

export function trierArticlesActus<Article extends Pick<ArticleActus<unknown>, "aLaUne" | "publieLe">>(articles: readonly Article[]): Article[] {
  return [...articles].sort((a, b) => Number(b.aLaUne) - Number(a.aLaUne) || Date.parse(b.publieLe) - Date.parse(a.publieLe));
}
