import { useMemo } from "react";

import { ARTICLES_ENVOYES_SEMAINE_EXEMPLE, articlesActusExemples, commentairesActusExemples, mesArticlesActusExemples } from "~/contenus/actus-exemples";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export function utiliserActus() {
  const { invite } = utiliserProfil();
  const articles = useMemo(() => (invite ? articlesActusExemples.filter((a) => !a.alcool && !a.lieux.some((l) => l.type === "bar")) : articlesActusExemples), [invite]);
  return {
    articles,
    trouver: (id: number) => articles.find((a) => a.id === id) ?? null,
    commentaires: (id: number) => commentairesActusExemples[id] ?? [],
    mesArticles: mesArticlesActusExemples,
    envoyesCetteSemaine: ARTICLES_ENVOYES_SEMAINE_EXEMPLE,
  };
}
