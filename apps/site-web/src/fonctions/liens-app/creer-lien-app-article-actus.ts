import { SCHEMA_APP } from "../../contenus/liens-app.ts";

export function creerLienAppArticleActus(articleId: number): string {
  return `${SCHEMA_APP}://actus/${articleId}`;
}
