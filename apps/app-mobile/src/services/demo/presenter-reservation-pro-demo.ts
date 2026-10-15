import { calculerLimiteReponseReservation } from "@sos-miam/commun/fonctions/reservations/calculer-limite-reponse-reservation";
import { calculerPropositionsReservation } from "@sos-miam/commun/fonctions/reservations/calculer-propositions-reservation";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { trouverClientDemo } from "./trouver-client-demo";
import type { ClientDemo, MagasinDemo, ReservationDemo } from "./types-demo";

export function presenterReservationProDemo(m: Readonly<MagasinDemo>, r: ReservationDemo, moi: ClientDemo | null): ReservationPro {
  const client = trouverClientDemo(m, r.client, moi);
  return {
    id: r.id,
    prenom: client.prenom,
    initialeNom: client.initialeNom,
    avatar: client.avatar,
    personnes: r.personnes,
    creneau: r.creneau,
    propositions: calculerPropositionsReservation(r, null, []),
    automatique: false,
    limiteReponse: calculerLimiteReponseReservation(r, null),
    message: r.message,
    statut: r.statut,
    presence: r.presenceLe !== null,
    code: r.statut === "acceptee" || r.statut === "honoree" ? r.code : null,
    creeLe: r.creeLe,
  };
}
