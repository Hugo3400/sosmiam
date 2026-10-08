import { formaterHeure } from "~/fonctions/dates/formater-heure";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Le moment d'un message, comme dans une liste de discussions : « 14h32 » aujourd'hui, « Hier », « lun. » dans la semaine,
 * « 3 oct. » cette année, « 3 oct. 2025 » avant. `lu` est la version à faire lire par VoiceOver et TalkBack
 * (« aujourd'hui à 14h32 », « hier », « lundi », « 3 octobre »), sans abréviation.
 */
export function formaterMomentRelatif(iso: string, maintenant: Date = new Date()): { court: string; lu: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
  const ecart = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / 86_400_000);
  if (ecart <= 0) {
    const heure = formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`);
    return { court: heure, lu: `aujourd'hui à ${heure}` };
  }
  if (ecart === 1) return { court: "Hier", lu: "hier" };
  if (ecart < 7) return { court: JOURS_COURTS[date.getDay()], lu: JOURS[date.getDay()] };
  const jour = date.getDate() === 1 ? "1er" : String(date.getDate());
  const annee = date.getFullYear() === maintenant.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return { court: `${jour} ${MOIS_COURTS[date.getMonth()]}${annee}`, lu: `${jour} ${MOIS[date.getMonth()]}${annee}` };
}
