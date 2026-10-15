import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import type { Reservation } from "@sos-miam/commun/types/reservation";

export type GestesReservation = { annuler: boolean; annulationTardive: boolean; presence: boolean };

export function calculerGestesReservation(reservation: Reservation, maintenantMs: number): GestesReservation {
  const annulation = faireEvoluerReservation(reservation, { type: "annuler-client" }, maintenantMs);
  const presence = faireEvoluerReservation(reservation, { type: "presence" }, maintenantMs);
  return { annuler: annulation.ok, annulationTardive: annulation.ok && annulation.tardive, presence: presence.ok };
}
