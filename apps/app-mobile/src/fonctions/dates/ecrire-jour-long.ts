import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** « Vendredi 17 octobre » (avec l'année si ce n'est pas celle-ci), d'après l'heure du téléphone. */
export function ecrireJourLong(instant: Date | string, maintenant: Date = new Date()): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const longue = formaterDateLongue(formaterDateIso(date));
  const texte = `${JOURS[date.getDay()]} ${date.getFullYear() === maintenant.getFullYear() ? longue.replace(/ \d+$/, "") : longue}`;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
