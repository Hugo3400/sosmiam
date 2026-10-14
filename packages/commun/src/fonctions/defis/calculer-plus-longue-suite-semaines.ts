const JOUR_MS = 24 * 60 * 60_000;
const SEMAINE_MS = 7 * JOUR_MS;
/** Un lundi, pour numéroter les semaines (lundi → dimanche, comme les semaines ISO) */
const LUNDI_REPERE = Date.UTC(1970, 0, 5);

/** Le numéro de la semaine (lundi → dimanche) d'un jour « AAAA-MM-JJ », ou null s'il est mal écrit */
function numeroterSemaine(jour: string): number | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  if (!date) return null;
  const midi = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]), 12);
  if (Number.isNaN(midi)) return null;
  const rangDansSemaine = (new Date(midi).getUTCDay() + 6) % 7;
  return Math.round((midi - rangDansSemaine * JOUR_MS - LUNDI_REPERE) / SEMAINE_MS);
}

/**
 * La plus longue suite de semaines consécutives (semaines ISO, du lundi au dimanche) qui ont au moins un de ces jours
 * « AAAA-MM-JJ » (des jours de Paris : calculerJourParis). Plusieurs jours de la même semaine comptent une fois ; une
 * semaine sans rien coupe la suite. 0 sans aucun jour. Passe le changement d'année (semaine 53 puis semaine 1).
 */
export function calculerPlusLongueSuiteSemaines(jours: readonly string[]): number {
  const semaines = [...new Set(jours.map(numeroterSemaine).filter((n): n is number => n !== null))].sort((a, b) => a - b);
  let plusLongue = 0;
  let suite = 0;
  semaines.forEach((semaine, i) => {
    suite = i > 0 && semaine === semaines[i - 1]! + 1 ? suite + 1 : 1;
    plusLongue = Math.max(plusLongue, suite);
  });
  return plusLongue;
}
