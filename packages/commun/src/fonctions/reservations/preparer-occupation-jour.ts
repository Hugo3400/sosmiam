import type { OccupationReservation, ServiceReservation } from "../../types/reglages-reservations.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { lireHeureParis } from "../temps/lire-heure-paris.ts";
import { lireJourSemaine } from "../temps/lire-jour-semaine.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";
import { rattacherServiceReservation } from "./rattacher-service-reservation.ts";

export type OccupationJour = {
  jour: string;
  tables: readonly { instant: number; personnes: number }[];
  parService: ReadonlyMap<ServiceReservation, number>;
};

export function preparerOccupationJour(
  services: readonly ServiceReservation[],
  jour: string,
  occupees: readonly OccupationReservation[],
): OccupationJour {
  const jourSemaine = lireJourSemaine(jour);
  const tables: { instant: number; personnes: number }[] = [];
  const parService = new Map<ServiceReservation, number>();
  for (const occupee of occupees) {
    const instant = Date.parse(occupee.creneau);
    if (Number.isNaN(instant) || jourSemaine === null || calculerJourParis(instant) !== jour) continue;
    tables.push({ instant, personnes: occupee.personnes });
    const minute = lireMinutesHeure(lireHeureParis(instant));
    const service = minute === null ? null : rattacherServiceReservation(services, jourSemaine, minute);
    if (service) parService.set(service, (parService.get(service) ?? 0) + occupee.personnes);
  }
  return { jour, tables, parService };
}
