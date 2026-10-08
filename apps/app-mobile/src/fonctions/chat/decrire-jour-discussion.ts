import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Le jour écrit au-dessus des messages d'une discussion : « Aujourd'hui », « Hier », « Lundi 6 octobre »
 * (avec l'année si ce n'est pas celle-ci : « Lundi 6 octobre 2025 »).
 */
export function decrireJourDiscussion(date: Date, maintenant: Date): string {
  // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
  const ecart = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / 86_400_000);
  if (ecart <= 0) return "Aujourd'hui";
  if (ecart === 1) return "Hier";
  const longue = formaterDateLongue(formaterDateIso(date));
  return `${JOURS[date.getDay()]} ${date.getFullYear() === maintenant.getFullYear() ? longue.replace(/ \d+$/, "") : longue}`;
}
