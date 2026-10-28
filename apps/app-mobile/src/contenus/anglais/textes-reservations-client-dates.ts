import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { DATES_RESERVATION, JOURS_SEMAINE_RESERVATION } from "~/contenus/textes-reservations-client-dates";

const ecrireOrdinal = (n: number) => {
  const centaine = n % 100;
  if (centaine >= 11 && centaine <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

export const DATES_RESERVATION_ANGLAIS: Traduction<typeof DATES_RESERVATION> = {
  aujourdhui: "Today",
  aujourdhuiCourt: "Today",
  demain: "Tomorrow",
  hier: "Yesterday",
  aHeure: (jour: string, heure: string) => `${jour} at ${heure}`,
  proche: (proche: string, date: string) => `${proche}, ${date}`,
  service: (libelle: string, rang: number) => `${libelle}, ${ecrireOrdinal(rang)} sitting`,
  puis: (debut: string, dernier: string) => `${debut}, then ${dernier}`,
};

export const JOURS_SEMAINE_RESERVATION_ANGLAIS: Traduction<typeof JOURS_SEMAINE_RESERVATION> = {
  aucun: "No days",
  tous: "Every day",
  sauf: (jour: string) => `Every day except ${jour}`,
  un: (jour: string) => `${jour}s`,
  suite: (debut: string, fin: string) => `${debut} to ${fin}`,
  liste: (noms: readonly string[]) => `${noms.slice(0, -1).map((nom) => `${nom}s`).join(", ")} and ${noms[noms.length - 1]}s`,
};
