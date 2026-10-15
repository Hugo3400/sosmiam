import type { OccupationReservation, ServiceReservation } from "../../types/reglages-reservations.ts";
import { preparerOccupationJour } from "./preparer-occupation-jour.ts";

export function compterCouvertsService(
  services: readonly ServiceReservation[],
  service: ServiceReservation,
  jour: string,
  occupees: readonly OccupationReservation[],
): number {
  return preparerOccupationJour(services, jour, occupees).parService.get(service) ?? 0;
}
