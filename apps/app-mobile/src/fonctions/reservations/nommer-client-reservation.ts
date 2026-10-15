import type { ReservationPro } from "@sos-miam/commun/types/reservation";

export function nommerClientReservation(reservation: Pick<ReservationPro, "prenom" | "initialeNom">): string {
  return reservation.initialeNom ? `${reservation.prenom} ${reservation.initialeNom}.` : reservation.prenom;
}
