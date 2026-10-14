/**
 * Fin de validité d'un choix : 6 mois après la date du choix, au même jour du mois (ou au dernier jour du mois quand il
 * n'existe pas : un choix du 31 août vaut jusqu'au 28 ou 29 février). Ensuite, le bandeau revient.
 */
export function calculerFinConsentement(date: number): number {
  const debut = new Date(date);
  const annee = debut.getUTCFullYear();
  const mois = debut.getUTCMonth() + 6;
  const dernierJour = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  return Date.UTC(
    annee,
    mois,
    Math.min(debut.getUTCDate(), dernierJour),
    debut.getUTCHours(),
    debut.getUTCMinutes(),
    debut.getUTCSeconds(),
  );
}
