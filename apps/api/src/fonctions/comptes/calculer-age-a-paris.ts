import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/**
 * Âge en années pleines d'après une date de naissance « AAAA-MM-JJ », avec la date du jour à Paris (à 0 h 30 à Paris,
 * c'est déjà le lendemain, même si l'heure universelle dit encore la veille). Null si la date est mal écrite, n'existe
 * pas (30 février), est dans le futur ou avant 1900. La date ne sert qu'à ce calcul : elle n'est jamais gardée.
 */
export function calculerAgeAParis(dateNaissance: string, maintenant: Date = new Date()): number | null {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateNaissance);
  if (!morceaux) return null;
  const [annee, mois, jour] = [Number(morceaux[1]), Number(morceaux[2]), Number(morceaux[3])];
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (annee < 1900 || date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) return null;
  const [anneeDuJour, moisDuJour, jourDuJour] = calculerClesPeriodes(maintenant).jour.split("-").map(Number) as [number, number, number];
  const anniversairePasse = moisDuJour > mois || (moisDuJour === mois && jourDuJour >= jour);
  const age = anneeDuJour - annee - (anniversairePasse ? 0 : 1);
  return age >= 0 ? age : null;
}
