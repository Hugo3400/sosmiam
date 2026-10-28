import { lireCreneauxProposes } from "../../../../../packages/commun/src/fonctions/reservations/lire-creneaux-proposes.ts";
import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { Reservation } from "../../../../../packages/commun/src/types/reservation.ts";
import type { LigneReservation } from "../../services/reservations-regles.ts";

const iso = (date: Date | null) => (date ? date.toISOString() : null);

/**
 * Une réservation telle que la personne la voit (packages/commun, types/reservation.ts) : le code d'arrivée seulement une
 * fois acceptée, le motif seulement d'un refus ou d'une annulation par le lieu (liste fermée), jamais qui a répondu.
 * `visiteId` : la visite validée née de cette réservation.
 */
export function presenterReservation(r: LigneReservation, lieu: LieuResume, visiteId: number | null): Reservation {
  return {
    id: r.id,
    lieu,
    personnes: r.personnes,
    creneau: r.creneau.toISOString(),
    creneauxProposes: lireCreneauxProposes({ creneau: r.creneau.toISOString(), creneauxProposes: r.creneauxProposes.map((c) => c.toISOString()) }),
    automatique: r.automatique,
    message: r.message,
    statut: r.statut,
    motifRefus: r.statut === "refusee" || r.statut === "annulee" ? r.motifRefus : null,
    tardive: r.tardive,
    creeLe: r.creeLe.toISOString(),
    reponduLe: iso(r.reponduLe),
    presenceLe: iso(r.presenceLe),
    code: r.statut === "acceptee" || r.statut === "honoree" ? r.code : null,
    visiteId,
  };
}
