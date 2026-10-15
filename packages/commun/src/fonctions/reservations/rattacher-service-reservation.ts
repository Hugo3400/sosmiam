import { PAS_CRENEAUX_POSSIBLES, RATTACHEMENT_SERVICE_MAX_MIN } from "../../regles/reglages-reservations.ts";
import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { lireMinutesHeure } from "../temps/lire-minutes-heure.ts";

export function rattacherServiceReservation(services: readonly ServiceReservation[], jourSemaine: number, minute: number): ServiceReservation | null {
  let retenu: { service: ServiceReservation; ecart: number; premier: number } | null = null;
  for (const service of services) {
    if (!service.jours.includes(jourSemaine) || !PAS_CRENEAUX_POSSIBLES.includes(service.pas)) continue;
    const premier = lireMinutesHeure(service.premier);
    const dernier = lireMinutesHeure(service.dernier);
    if (premier === null || dernier === null || premier > dernier) continue;
    const ecart = minute < premier ? premier - minute : minute < dernier + service.pas ? 0 : minute - dernier;
    if (ecart > RATTACHEMENT_SERVICE_MAX_MIN) continue;
    if (!retenu || ecart < retenu.ecart || (ecart === retenu.ecart && premier < retenu.premier)) retenu = { service, ecart, premier };
  }
  return retenu?.service ?? null;
}
