import { CALENDRIER_PAR_LANGUE } from "../../contenus/calendrier.ts";
import type { Langue } from "../../regles/langues.ts";

export function ecrireMoisLangue(date: { annee: number; mois: number }, langue: Langue): string {
  return `${CALENDRIER_PAR_LANGUE[langue].mois[date.mois - 1] ?? ""} ${date.annee}`;
}
