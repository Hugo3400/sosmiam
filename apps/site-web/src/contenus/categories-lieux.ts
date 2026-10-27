// Les quatre catégories de lieux (mêmes valeurs que la colonne « type » de la table lieux de l'API).
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CATEGORIES_LIEUX_ANGLAIS } from "~/contenus/anglais/categories-lieux";
import type { CategorieLieu } from "~/types/lieux";

export const TEXTES_CATEGORIES_LIEUX = {
  resto: "Restos",
  patisserie: "Pâtisseries",
  bar: "Bars",
  sortie: "Sorties",
} satisfies Record<CategorieLieu, string>;

export const TEXTES_CATEGORIES_LIEUX_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CATEGORIES_LIEUX>> = {
  fr: TEXTES_CATEGORIES_LIEUX,
  en: TEXTES_CATEGORIES_LIEUX_ANGLAIS,
};

const ORDRE_CATEGORIES: readonly CategorieLieu[] = ["resto", "patisserie", "bar", "sortie"];

export const categoriesLieux: { valeur: CategorieLieu; libelle: string }[] = ORDRE_CATEGORIES.map((valeur) => ({ valeur, libelle: TEXTES_CATEGORIES_LIEUX[valeur] }));
