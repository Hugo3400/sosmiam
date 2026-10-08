/**
 * Transforme « AAAA-MM-JJ » en date locale, réglée à midi : aucun changement d'heure ni fuseau ne peut la faire
 * glisser au jour d'avant ou d'après.
 */
export function lireDateIso(texte: string): Date {
  const [annee, mois, jour] = texte.split("-").map(Number);
  return new Date(annee, mois - 1, jour, 12);
}
