import { ETIQUETTES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { FiltreCarte, RubriqueCarte } from "~/types/carte";

export function listerFiltresCarte(rubriques: readonly RubriqueCarte[]): FiltreCarte[] {
  const elements = rubriques.flatMap((rubrique) => rubrique.elements);
  const etiquettes = ETIQUETTES_CARTE.filter((etiquette) => elements.some((element) => element.etiquettes?.includes(etiquette)));
  const avecAlcool = elements.some((element) => element.alcool === true);
  const sansAlcool = elements.some((element) => element.alcool !== true);
  return avecAlcool && sansAlcool ? [...etiquettes, "sans-alcool"] : [...etiquettes];
}
