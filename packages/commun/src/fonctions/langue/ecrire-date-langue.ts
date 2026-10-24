import { CALENDRIER_PAR_LANGUE } from "../../contenus/calendrier.ts";
import type { Langue } from "../../regles/langues.ts";

export function ecrireDateLangue(date: { annee: number; mois: number; jour: number }, langue: Langue, options: { sansAnnee?: boolean; court?: boolean } = {}): string {
  const calendrier = CALENDRIER_PAR_LANGUE[langue];
  const mois = (options.court ? calendrier.moisCourts : calendrier.mois)[date.mois - 1] ?? "";
  const jour = langue === "fr" && date.jour === 1 ? "1er" : String(date.jour);
  return options.sansAnnee ? `${jour} ${mois}` : `${jour} ${mois} ${date.annee}`;
}
