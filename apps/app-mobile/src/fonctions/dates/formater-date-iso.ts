/**
 * Transforme une date en « AAAA-MM-JJ », avec le jour du calendrier local (pas de passage par UTC,
 * sinon une naissance le 12 mars à minuit pourrait devenir le 11 mars).
 */
export function formaterDateIso(date: Date): string {
  const annee = String(date.getFullYear()).padStart(4, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}
