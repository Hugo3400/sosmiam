import { THEMES_SAISON } from "../../regles/calendrier-themes-saison.ts";
import type { PeriodeThemeSaison, ThemeDuJour } from "../../regles/themes-saison.ts";

const mesurerDuree = (periode: PeriodeThemeSaison) => Date.parse(periode.fin) - Date.parse(periode.debut);

export function listerThemesDuJour(jour: string, ville?: string | null): ThemeDuJour[] {
  const actifs: ThemeDuJour[] = [];
  for (const theme of THEMES_SAISON) {
    if (theme.villes && (!ville || !theme.villes.includes(ville))) continue;
    const periode = theme.periodes.find((p) => p.debut <= jour && jour <= p.fin);
    if (periode) actifs.push({ theme, periode });
  }
  return actifs.sort((a, b) => b.theme.priorite - a.theme.priorite || mesurerDuree(a.periode) - mesurerDuree(b.periode));
}
