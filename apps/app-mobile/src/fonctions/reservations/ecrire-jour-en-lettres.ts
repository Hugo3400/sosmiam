import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lireJourSemaine } from "~/fonctions/dates/lire-jour-semaine";

const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function ecrireJourEnLettres(jour: string, aujourdhui: string): string {
  const longue = formaterDateLongue(jour);
  return `${NOMS_JOURS[lireJourSemaine(jour)]} ${jour.slice(0, 4) === aujourdhui.slice(0, 4) ? longue.replace(/ \d+$/, "") : longue}`;
}
