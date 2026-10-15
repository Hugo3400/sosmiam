import { FIN_SERVICE_MAX_MIN, PAS_CRENEAUX_POSSIBLES } from "../../regles/reglages-reservations.ts";
import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";

export function listerMinutesDuService(service: Pick<ServiceReservation, "premier" | "dernier" | "pas">): number[] {
  const premier = lireMinutesHeure(service.premier);
  const dernier = lireMinutesHeure(service.dernier);
  if (premier === null || dernier === null || premier > dernier || !PAS_CRENEAUX_POSSIBLES.includes(service.pas)) return [];
  const minutes: number[] = [];
  for (let minute = premier; minute <= dernier && minute + service.pas <= FIN_SERVICE_MAX_MIN; minute += service.pas) minutes.push(minute);
  return minutes;
}
