const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Date à l'heure de Paris : « 8 oct. 2026 », ou « 8 oct. 2026 à 15:42 » avec l'heure. */
export function formaterDate(date: string | Date, avecHeure = false): string {
  const valeur = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(valeur.getTime())) return "—";
  return avecHeure ? `${jour.format(valeur)} à ${heure.format(valeur)}` : jour.format(valeur);
}
