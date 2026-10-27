import { useMemo } from "react";

import { articlesActusExemples, commentairesActusExemples } from "~/contenus/actus-exemples";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export function utiliserActus() {
  const { invite } = utiliserProfil();
  const articles = useMemo(() => (invite ? articlesActusExemples.filter((a) => !a.alcool) : articlesActusExemples), [invite]);
  return {
    articles,
    trouver: (id: number) => articles.find((a) => a.id === id) ?? null,
    commentaires: (id: number) => commentairesActusExemples[id] ?? [],
  };
}
