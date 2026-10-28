import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { STATUTS_RESERVATION_PRO_PAR_LANGUE } from "~/contenus/textes-statut-reservation";
import type { EtiquetteReservation } from "~/fonctions/reservations/decrire-statut-reservation";

export function decrireStatutReservationPro(reservation: Pick<ReservationPro, "statut" | "presence">, langue: Langue): EtiquetteReservation {
  const T = choisirTextes(STATUTS_RESERVATION_PRO_PAR_LANGUE, langue);
  switch (reservation.statut) {
    case "demandee":
      return { ...T.demandee, ton: "attente" };
    case "acceptee":
      return reservation.presence ? { ...T.surPlace, ton: "jaune" } : { ...T.acceptee, ton: "jaune" };
    case "honoree":
      return { ...T.honoree, ton: "jaune" };
    case "absent":
      return { ...T.absent, ton: "rose" };
    case "refusee":
      return { ...T.refusee, ton: "doux" };
    case "annulee":
      return { ...T.annulee, ton: "doux" };
    case "expiree":
      return { ...T.expiree, ton: "doux" };
  }
}
