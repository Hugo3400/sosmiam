import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { ecrireHeureMinutes } from "../temps/ecrire-heure-minutes.ts";
import { listerMinutesDuService } from "./lister-minutes-du-service.ts";

export function listerHeuresService(service: Pick<ServiceReservation, "premier" | "dernier" | "pas">): string[] {
  return listerMinutesDuService(service).map(ecrireHeureMinutes);
}
