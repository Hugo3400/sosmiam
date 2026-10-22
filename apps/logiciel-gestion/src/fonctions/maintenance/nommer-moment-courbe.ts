import type { PeriodeCourbes } from "~/services/machines.ts";

const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const jour = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: "Europe/Paris" });
const long = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export function nommerMomentCourbe(le: string, periode: PeriodeCourbes, detaille = false): string {
  const date = new Date(le);
  if (detaille) return long.format(date);
  return periode === "1h" || periode === "24h" ? heure.format(date) : jour.format(date);
}
