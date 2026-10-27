import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE } from "~/contenus/signaler-article-actus";
import type { ChampSignalerArticleActus, CodeErreurSignalerArticleActus } from "~/fonctions/actus/lire-formulaire-signaler-article-actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const CHAMPS: readonly ChampSignalerArticleActus[] = ["raison", "explication"];

export function ecrireErreursSignalerArticleActus(
  codes: Partial<Record<ChampSignalerArticleActus, CodeErreurSignalerArticleActus>>,
  langue: Langue,
): Partial<Record<ChampSignalerArticleActus, string>> {
  const textes = choisirTextes(TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE, langue).erreurs;
  const erreurs: Partial<Record<ChampSignalerArticleActus, string>> = {};
  for (const champ of CHAMPS) {
    const code = codes[champ];
    if (code) erreurs[champ] = lierPonctuation(textes[code]);
  }
  return erreurs;
}
