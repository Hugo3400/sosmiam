import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Reservation } from "@sos-miam/commun/types/reservation";

export type LectureMesReservations = { etat: "attente" } | { etat: "lu"; reservations: Reservation[] } | { etat: "erreur"; erreur: ErreurService };

export type EvenementLectureReservations =
  | { type: "lue"; reservations: Reservation[] }
  | { type: "ratee"; erreur: ErreurService }
  | { type: "lue-ailleurs"; reservations: Reservation[] }
  | { type: "remplacee"; reservation: Reservation };

export function suivreLectureReservations(avant: LectureMesReservations, evenement: EvenementLectureReservations): LectureMesReservations {
  switch (evenement.type) {
    case "lue":
    case "lue-ailleurs":
      return { etat: "lu", reservations: evenement.reservations };
    case "ratee":
      return avant.etat === "lu" ? avant : { etat: "erreur", erreur: evenement.erreur };
    case "remplacee":
      if (avant.etat !== "lu") return avant;
      return { etat: "lu", reservations: avant.reservations.map((r) => (r.id === evenement.reservation.id ? evenement.reservation : r)) };
  }
}
