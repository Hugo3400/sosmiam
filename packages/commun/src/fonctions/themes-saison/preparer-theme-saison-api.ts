import { TEXTES_THEMES_SAISON_PAR_LANGUE } from "../../contenus/themes-saison.ts";
import type { Langue } from "../../regles/langues.ts";
import type { ThemeDuJour } from "../../regles/themes-saison.ts";
import type { ThemeSaisonApi } from "../../types/theme-saison.ts";

export function preparerThemeSaisonApi({ theme, periode }: ThemeDuJour, langue: Langue): ThemeSaisonApi {
  return {
    id: theme.id,
    famille: theme.famille,
    tenue: theme.tenue,
    couleurs: theme.couleurs,
    couleursSombres: theme.couleursSombres ?? theme.couleurs,
    sobre: theme.sobre === true,
    lienInfo: theme.lienInfo ?? null,
    debut: periode.debut,
    fin: periode.fin,
    textes: TEXTES_THEMES_SAISON_PAR_LANGUE[langue][theme.id],
  };
}
