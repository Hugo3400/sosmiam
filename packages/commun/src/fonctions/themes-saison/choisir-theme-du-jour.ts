import type { ThemeDuJour } from "../../regles/themes-saison.ts";
import { listerThemesDuJour } from "./lister-themes-du-jour.ts";

export function choisirThemeDuJour(jour: string, ville?: string | null): ThemeDuJour | null {
  return listerThemesDuJour(jour, ville)[0] ?? null;
}
