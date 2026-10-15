import { formaterJourEnLettres } from "./formater-jour-en-lettres.ts";

const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const HEURE_PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * Un moment ISO 8601 dit à l'heure de Paris : « 22 octobre 2026 à 12 h » (« 12 h 30 » avec des minutes) ; null si
 * illisible.
 */
export function formaterMomentAParis(moment: string): string | null {
  const date = new Date(moment);
  if (Number.isNaN(date.getTime())) return null;
  const jour = formaterJourEnLettres(JOUR_PARIS.format(date));
  const [heures, minutes] = HEURE_PARIS.format(date).split(":");
  if (!jour || !heures || !minutes) return null;
  return `${jour} à ${Number(heures)} h${minutes === "00" ? "" : ` ${minutes}`}`;
}
