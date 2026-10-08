export type ClesPeriodes = { jour: string; semaine: string; mois: string; annee: string };

const formatJour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * Repères des périodes qui contiennent ce moment, à l'heure de Paris :
 * jour « 2026-10-08 », semaine ISO « 2026-S41 » (lundi → dimanche), mois « 2026-10 », année « 2026 ».
 */
export function calculerClesPeriodes(moment: Date): ClesPeriodes {
  const jour = formatJour.format(moment);
  const [annee, mois, quantieme] = jour.split("-").map(Number) as [number, number, number];
  // Semaine ISO : celle du jeudi de la même semaine, qui décide aussi de l'année de la semaine
  const date = new Date(Date.UTC(annee, mois - 1, quantieme));
  const rangDansSemaine = (date.getUTCDay() + 6) % 7;
  const jeudi = new Date(date.getTime() + (3 - rangDansSemaine) * 86_400_000);
  const anneeSemaine = jeudi.getUTCFullYear();
  const numero = 1 + Math.floor((jeudi.getTime() - Date.UTC(anneeSemaine, 0, 1)) / (7 * 86_400_000));
  return {
    jour,
    semaine: `${anneeSemaine}-S${String(numero).padStart(2, "0")}`,
    mois: jour.slice(0, 7),
    annee: jour.slice(0, 4),
  };
}
