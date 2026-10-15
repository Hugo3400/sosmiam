import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import type { EvenementReservation, Reservation } from "@sos-miam/commun/types/reservation";

export function appliquerGesteReservation(reservation: Reservation, evenement: EvenementReservation, maintenantMs: number): Reservation {
  const transition = faireEvoluerReservation(reservation, evenement, maintenantMs);
  if (!transition.ok) return reservation;
  return { ...reservation, statut: transition.statut, presenceLe: transition.presenceLe, tardive: reservation.tardive || transition.tardive };
}
