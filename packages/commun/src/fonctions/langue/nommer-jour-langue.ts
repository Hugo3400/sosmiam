import { CALENDRIER_PAR_LANGUE } from "../../contenus/calendrier.ts";
import type { Langue } from "../../regles/langues.ts";

export function nommerJourLangue(jourSemaine: number, langue: Langue, court = false): string {
  const calendrier = CALENDRIER_PAR_LANGUE[langue];
  return (court ? calendrier.joursCourts : calendrier.jours)[jourSemaine] ?? "";
}
