import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export type GestesReservationPro = { accepter: boolean; refuser: boolean; venu: boolean; absent: boolean };

export function calculerGestesReservationPro(reservation: Pick<ReservationPro, "statut" | "creneau" | "presence">, maintenantMs: number): GestesReservationPro {
  const etat = { statut: reservation.statut, creneau: reservation.creneau, presenceLe: reservation.presence ? reservation.creneau : null };
  const possible = (type: "accepter" | "venu" | "absent") => faireEvoluerReservation(etat, { type }, maintenantMs).ok;
  return {
    accepter: possible("accepter"),
    refuser: faireEvoluerReservation(etat, { type: "refuser", motif: "autre" }, maintenantMs).ok,
    venu: possible("venu"),
    absent: possible("absent"),
  };
}
