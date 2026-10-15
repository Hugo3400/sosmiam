import type { ServiceReservation } from "../../types/reglages-reservations.ts";
import { listerMinutesDuService } from "./lister-minutes-du-service.ts";

export type MinuteDeService = { minute: number; service: ServiceReservation };

export function listerMinutesServices(services: readonly ServiceReservation[], jourSemaine: number): MinuteDeService[] {
  return services
    .filter((service) => service.jours.includes(jourSemaine))
    .flatMap((service) => listerMinutesDuService(service).map((minute) => ({ minute, service })))
    .sort((a, b) => a.minute - b.minute);
}
