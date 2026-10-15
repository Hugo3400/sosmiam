export function lireJourSemaine(jour: string): number | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  if (!date) return null;
  const [annee, mois, quantieme] = [Number(date[1]), Number(date[2]), Number(date[3])];
  const instant = new Date(Date.UTC(annee, mois - 1, quantieme));
  if (instant.getUTCMonth() !== mois - 1 || instant.getUTCDate() !== quantieme) return null;
  return instant.getUTCDay();
}
