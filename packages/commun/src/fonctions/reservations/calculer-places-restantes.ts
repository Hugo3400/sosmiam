import type { OccupationReservation, ServiceReservation } from "../../types/reglages-reservations.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";
import { ecrireHeureMinutes } from "../temps/ecrire-heure-minutes.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";
import type { OccupationJour } from "./preparer-occupation-jour.ts";

export type CreneauDuService = { services: readonly ServiceReservation[]; service: ServiceReservation; jour: string; minute: number };

export function calculerPlacesRestantes(c: CreneauDuService, occupation: OccupationJour | readonly OccupationReservation[]): number {
  const lue = "parService" in occupation ? occupation : preparerOccupationJour(c.services, c.jour, occupation);
  const pasMs = c.service.pas * 60_000;
  const debut = calculerInstantParis(c.jour, ecrireHeureMinutes(c.minute));
  let dansCreneau = 0;
  for (const table of lue.tables) if (table.instant >= debut && table.instant < debut + pasMs) dansCreneau += table.personnes;
  return Math.min(c.service.couvertsParCreneau - dansCreneau, c.service.couvertsParService - (lue.parService.get(c.service) ?? 0));
}
