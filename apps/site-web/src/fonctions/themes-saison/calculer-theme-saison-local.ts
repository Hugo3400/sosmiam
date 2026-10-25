import { choisirThemeDuJour } from "../../../../../packages/commun/src/fonctions/themes-saison/choisir-theme-du-jour.ts";
import { preparerThemeSaisonApi } from "../../../../../packages/commun/src/fonctions/themes-saison/preparer-theme-saison-api.ts";
import { calculerJourParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { ThemeSaisonApi } from "../../../../../packages/commun/src/types/theme-saison.ts";

export function calculerThemeSaisonLocal(instantMs: number, langue: Langue): ThemeSaisonApi | null {
  const themeDuJour = choisirThemeDuJour(calculerJourParis(instantMs));
  return themeDuJour ? preparerThemeSaisonApi(themeDuJour, langue) : null;
}
