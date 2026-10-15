import { PAS_CRENEAUX_POSSIBLES } from "../../regles/reglages-reservations.ts";
import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";
import type { MinuteDeService } from "./lister-minutes-services.ts";

export function trouverServiceReservation(services: readonly ServiceReservation[], jourSemaine: number, minute: number): MinuteDeService | null {
  for (const service of services) {
    if (!service.jours.includes(jourSemaine) || !PAS_CRENEAUX_POSSIBLES.includes(service.pas)) continue;
    const premier = lireMinutesHeure(service.premier);
    const dernier = lireMinutesHeure(service.dernier);
    if (premier === null || dernier === null || minute < premier || minute >= dernier + service.pas) continue;
    return { minute: premier + Math.floor((minute - premier) / service.pas) * service.pas, service };
  }
  return null;
}
