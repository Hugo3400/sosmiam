const JOUR_MS = 24 * 60 * 60_000;
const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/**
 * Le jour « AAAA-MM-JJ » qui tombe `jours` jours après celui-ci (avant, si négatif) : un jour du calendrier, sans heure ni
 * fuseau (« 2026-10-31 » + 1 → « 2026-11-01 », même la nuit du changement d'heure). Rend "" si le jour est mal écrit.
 */
export function decalerJour(jour: string, jours: number): string {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  if (!date) return "";
  const decale = new Date(Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3])) + jours * JOUR_MS);
  return `${decale.getUTCFullYear()}-${deuxChiffres(decale.getUTCMonth() + 1)}-${deuxChiffres(decale.getUTCDate())}`;
}
