import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { ENTREE_MES_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-mes-reservations";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { listerReservationsEnCours } from "~/fonctions/reservations/lister-reservations-en-cours";

export function resumerMesReservations(reservations: readonly Reservation[], maintenantMs: number, langue: Langue): string {
  const entree = choisirTextes(ENTREE_MES_RESERVATIONS_PAR_LANGUE, langue);
  if (reservations.length === 0) return entree.vide;
  const enCours = listerReservationsEnCours(reservations, maintenantMs);
  if (enCours.length === 0) return entree.rienDePrevu;
  const T = choisirTextes(CARTE_RESERVATION_PAR_LANGUE, langue);
  const enAttente = enCours.filter((r) => r.statut === "demandee").length;
  const aVenir = T.entreeAVenir(enCours.length);
  return enAttente > 0 ? T.entreeEnAttente(aVenir, enAttente) : aVenir;
}
