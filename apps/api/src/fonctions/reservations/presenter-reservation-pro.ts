import type { ReservationPro } from "../../../../../packages/commun/src/types/reservation.ts";
import type { LigneReservation } from "../../services/reservations-regles.ts";
import type { ClientComptoir } from "../visites/presenter-client-comptoir.ts";

/**
 * Une réservation telle que l'équipe du lieu la voit (types/reservation.ts) : prénom, initiale et emoji du client
 * (presenterClientComptoir), jamais son âge ; le code d'arrivée une fois acceptée.
 */
export function presenterReservationPro(r: LigneReservation, client: ClientComptoir): ReservationPro {
  return {
    id: r.id,
    ...client,
    personnes: r.personnes,
    creneau: r.creneau.toISOString(),
    message: r.message,
    statut: r.statut,
    presence: r.presenceLe !== null,
    code: r.statut === "acceptee" || r.statut === "honoree" ? r.code : null,
    creeLe: r.creeLe.toISOString(),
  };
}
