export function lireJourSemaine(jour: string): number {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  return new Date(Date.UTC(annee, mois - 1, quantieme)).getUTCDay();
}
