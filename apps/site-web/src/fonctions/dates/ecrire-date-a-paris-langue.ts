import { ecrireDateLangue } from "../../../../../packages/commun/src/fonctions/langue/ecrire-date-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";

const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

export function ecrireDateAParisLangue(moment: string, langue: Langue): string | null {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(moment) ? `${moment}T12:00:00Z` : moment);
  if (Number.isNaN(date.getTime())) return null;
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(JOUR_PARIS.format(date));
  if (!morceaux) return null;
  return ecrireDateLangue({ annee: Number(morceaux[1]), mois: Number(morceaux[2]), jour: Number(morceaux[3]) }, langue);
}
