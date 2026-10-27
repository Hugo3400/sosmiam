import type { RubriqueActus } from "../../../../packages/commun/src/regles/actus.ts";
import type { ArticleActus } from "../../../../packages/commun/src/types/actus.ts";

export type ArticleActusSite = ArticleActus<string | null>;

export type FiltresActus = { rubrique: RubriqueActus | null; ville: string | null; curseur: string | null };

export type VilleActus = { identifiant: string; nom: string };

export type PageActus = { articles: ArticleActusSite[]; villes: VilleActus[]; suivant: string | null };
