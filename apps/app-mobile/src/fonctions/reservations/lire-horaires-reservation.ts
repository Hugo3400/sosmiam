import type { Reservation } from "@sos-miam/commun/types/reservation";

export type HorairesReservation = { affiche: string; autres: string[]; planB: { premier: string } | null };

const RETENUE = new Set(["acceptee", "honoree", "absent"]);

export function lireHorairesReservation(reservation: Pick<Reservation, "statut" | "creneau" | "creneauxProposes" | "reponduLe">): HorairesReservation {
  const proposes = reservation.creneauxProposes.length > 0 ? reservation.creneauxProposes : [reservation.creneau];
  const retenue = RETENUE.has(reservation.statut) || (reservation.statut === "annulee" && reservation.reponduLe !== null);
  if (!retenue) return { affiche: proposes[0]!, autres: proposes.slice(1), planB: null };
  const premier = proposes[0]!;
  const planB = proposes.length > 1 && Date.parse(premier) !== Date.parse(reservation.creneau) ? { premier } : null;
  return { affiche: reservation.creneau, autres: [], planB };
}
