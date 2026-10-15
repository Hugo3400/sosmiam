import type { Reservation } from "@sos-miam/commun/types/reservation";

import { ENTREE_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { listerReservationsEnCours } from "~/fonctions/reservations/lister-reservations-en-cours";

export function resumerMesReservations(reservations: readonly Reservation[], maintenantMs: number): string {
  if (reservations.length === 0) return ENTREE_MES_RESERVATIONS.vide;
  const enCours = listerReservationsEnCours(reservations, maintenantMs);
  if (enCours.length === 0) return ENTREE_MES_RESERVATIONS.rienDePrevu;
  const enAttente = enCours.filter((r) => r.statut === "demandee").length;
  const aVenir = `${enCours.length} à venir`;
  return enAttente > 0 ? `${aVenir} · ${enAttente} en attente du lieu` : aVenir;
}
