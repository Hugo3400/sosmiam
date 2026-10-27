import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import { articlesActusExemples } from "~/contenus/actus-exemples";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";

export function lireExemplesActus(rubrique: RubriqueActus | null, invite: boolean): ArticleActusAffiche[] {
  return articlesActusExemples.filter((a) => (rubrique === null || a.rubrique === rubrique) && (!invite || (!a.alcool && !a.lieux.some((l) => l.type === "bar"))));
}
