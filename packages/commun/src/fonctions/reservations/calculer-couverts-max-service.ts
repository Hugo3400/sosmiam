import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { listerMinutesDuService } from "./lister-minutes-du-service.ts";

export function calculerCouvertsMaxService(service: ServiceReservation): number | null {
  const creneaux = listerMinutesDuService(service).length;
  if (creneaux === 0) return null;
  return Math.min(creneaux * service.couvertsParCreneau, service.couvertsParService);
}
