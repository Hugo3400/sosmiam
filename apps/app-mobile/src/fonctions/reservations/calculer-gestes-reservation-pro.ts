import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export type GestesReservationPro = { accepter: boolean; refuser: boolean; venu: boolean; absent: boolean; annuler: boolean };

export function calculerGestesReservationPro(
  reservation: Pick<ReservationPro, "statut" | "creneau" | "presence"> & { limiteReponse?: string | null },
  maintenantMs: number,
): GestesReservationPro {
  const etat = { statut: reservation.statut, creneau: reservation.creneau, presenceLe: reservation.presence ? reservation.creneau : null };
  const limite = reservation.limiteReponse ? Date.parse(reservation.limiteReponse) : Number.NaN;
  const regles = Number.isNaN(limite) ? {} : { expirationAvantCreneauMs: Date.parse(reservation.creneau) - limite };
  const possible = (type: "accepter" | "venu" | "absent") => faireEvoluerReservation(etat, { type }, maintenantMs, regles).ok;
  return {
    accepter: possible("accepter"),
    refuser: faireEvoluerReservation(etat, { type: "refuser", motif: "autre" }, maintenantMs).ok,
    venu: possible("venu"),
    absent: possible("absent"),
    annuler: faireEvoluerReservation(etat, { type: "annuler-lieu", motif: "autre" }, maintenantMs).ok,
  };
}
