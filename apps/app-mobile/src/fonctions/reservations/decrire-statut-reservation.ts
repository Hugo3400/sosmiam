import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { STATUTS_RESERVATION_PAR_LANGUE } from "~/contenus/textes-statut-reservation";
import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";

export type TonEtiquetteReservation = "jaune" | "attente" | "rose" | "doux";

export type EtiquetteReservation = { texte: string; lu: string; ton: TonEtiquetteReservation };

type Statuts = (typeof STATUTS_RESERVATION_PAR_LANGUE)["fr"];

function decrireAcceptee(reservation: Reservation, maintenantMs: number, T: Statuts): EtiquetteReservation {
  if (estReservationNonPointee(reservation, maintenantMs)) return { ...T.creneauPasse, ton: "doux" };
  return reservation.presenceLe ? { ...T.surPlace, ton: "jaune" } : { ...T.reserve, ton: "jaune" };
}

export function decrireStatutReservation(reservation: Reservation, maintenantMs: number, langue: Langue): EtiquetteReservation {
  const T = choisirTextes(STATUTS_RESERVATION_PAR_LANGUE, langue);
  switch (reservation.statut) {
    case "demandee":
      return { ...T.demandee, ton: "attente" };
    case "acceptee":
      return decrireAcceptee(reservation, maintenantMs, T);
    case "refusee":
      return { ...T.refusee, ton: "rose" };
    case "annulee":
      if (reservation.motifRefus) return { ...T.annuleeParLieu, ton: "rose" };
      return reservation.reponduLe === null ? { ...T.demandeAnnulee, ton: "doux" } : { ...T.annuleeParToi, ton: "doux" };
    case "expiree":
      return { ...T.expiree, ton: "doux" };
    case "honoree":
      return { ...T.honoree, ton: "jaune" };
    case "absent":
      return { ...T.absent, ton: "rose" };
  }
}
