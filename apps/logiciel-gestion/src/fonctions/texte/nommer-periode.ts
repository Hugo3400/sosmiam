const jourCourt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const jourLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const mois = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const moisLong = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Nom d'une période d'après sa clé (« 2026-10-08 », « 2026-S41 », « 2026-10 », « 2026 ») :
 * court pour l'axe d'un graphique (« 8 oct. », « S41 », « oct. 2026 »), long pour une info-bulle.
 */
export function nommerPeriode(cle: string, long = false): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(cle)) {
    const date = new Date(`${cle}T00:00:00Z`);
    return (long ? jourLong : jourCourt).format(date);
  }
  const semaine = /^(\d{4})-S(\d{2})$/.exec(cle);
  if (semaine) return long ? `Semaine ${Number(semaine[2])} de ${semaine[1]}` : `S${Number(semaine[2])}`;
  if (/^\d{4}-\d{2}$/.test(cle)) return (long ? moisLong : mois).format(new Date(`${cle}-01T00:00:00Z`));
  return cle;
}
