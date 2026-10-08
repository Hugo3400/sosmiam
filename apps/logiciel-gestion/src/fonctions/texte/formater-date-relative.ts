const relatif = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const PAS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/** Moment relatif : « il y a 3 minutes », « hier », « dans 2 jours ». « à l'instant » sous une minute. */
export function formaterDateRelative(date: string | Date, maintenant = new Date()): string {
  const secondes = Math.round(((typeof date === "string" ? new Date(date) : date).getTime() - maintenant.getTime()) / 1000);
  if (Math.abs(secondes) < 60) return "à l'instant";
  for (const [unite, duree] of PAS) {
    if (Math.abs(secondes) >= duree) return relatif.format(Math.round(secondes / duree), unite);
  }
  return "à l'instant";
}
