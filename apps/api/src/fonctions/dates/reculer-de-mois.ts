/**
 * La même date, `mois` mois plus tôt (calendrier, comme Date#setMonth : le 31 mai moins 3 mois donne le 3 mars, le
 * 28 février n'ayant pas de 31). Sert aux durées de conservation en mois (candidatures refusées : 3 mois).
 */
export function reculerDeMois(date: Date, mois: number): Date {
  const resultat = new Date(date);
  resultat.setMonth(resultat.getMonth() - mois);
  return resultat;
}
