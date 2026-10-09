const formatHeure = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** L'heure qu'il est à Paris à ce moment, en « HH:MM » (pour l'heure de fin d'un SOS du soir, telle que l'app l'affiche) */
export function formaterHeureParis(date: Date): string {
  return formatHeure.format(date);
}
