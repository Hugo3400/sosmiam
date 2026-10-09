/**
 * La même date, `mois` mois plus tôt sur le calendrier (en temps universel, pour un résultat qui ne dépend pas du fuseau
 * du serveur ; comme Date#setUTCMonth : le 31 mai moins 3 mois donne le 3 mars, février n'ayant pas de 31). Sert aux
 * durées de conservation en mois (candidatures refusées : 3 mois). La date reçue n'est pas changée.
 */
export function reculerDeMois(date: Date, mois: number): Date {
  const resultat = new Date(date);
  resultat.setUTCMonth(resultat.getUTCMonth() - mois);
  return resultat;
}
