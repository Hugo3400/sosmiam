import type { ReservationPro } from "../../../../../packages/commun/src/types/reservation.ts";
import type { LigneReservation } from "../../services/reservations-regles.ts";

/** Ce que l'équipe voit du client : prénom, initiale du nom et emoji, jamais l'âge ni le nom complet */
export type ClientVuParLeLieu = { prenom: string; initialeNom: string | null; avatar: string };

/** Une réservation telle que l'équipe du lieu la voit (types/reservation.ts) : le code d'arrivée une fois acceptée. */
export function presenterReservationPro(r: LigneReservation, client: ClientVuParLeLieu): ReservationPro {
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
