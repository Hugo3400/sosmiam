import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { DATES_RESERVATION_ANGLAIS, JOURS_SEMAINE_RESERVATION_ANGLAIS } from "~/contenus/anglais/textes-reservations-client-dates";

export const DATES_RESERVATION = {
  aujourdhui: "Aujourd'hui",
  aujourdhuiCourt: "Auj.",
  demain: "Demain",
  hier: "Hier",
  aHeure: (jour: string, heure: string) => `${jour} à ${heure}`,
  proche: (proche: string, date: string) => `${proche}, ${date}`,
  service: (libelle: string, rang: number) => `${libelle}, ${rang === 1 ? "1er" : `${rang}e`} service`,
  puis: (debut: string, dernier: string) => `${debut}, puis ${dernier}`,
} as const;

export const DATES_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof DATES_RESERVATION>> = { fr: DATES_RESERVATION, en: DATES_RESERVATION_ANGLAIS };

export const JOURS_SEMAINE_RESERVATION = {
  aucun: "Aucun jour",
  tous: "Tous les jours",
  sauf: (jour: string) => `Tous les jours sauf le ${jour}`,
  un: (jour: string) => `Le ${jour}`,
  suite: (debut: string, fin: string) => `Du ${debut} au ${fin}`,
  liste: (noms: readonly string[]) => `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`,
} as const;

export const JOURS_SEMAINE_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof JOURS_SEMAINE_RESERVATION>> = {
  fr: JOURS_SEMAINE_RESERVATION,
  en: JOURS_SEMAINE_RESERVATION_ANGLAIS,
};
