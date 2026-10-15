import { listerCreneauxReservation } from "@sos-miam/commun/fonctions/reservations/lister-creneaux-reservation";
import type { CreneauOuverture } from "@sos-miam/commun/types/lieu";

import type { JourReservation } from "~/contenus/type-jour-reservation";
import { estFermeCeJour } from "~/fonctions/reservations/est-ferme-ce-jour";
import { listerJoursReservation } from "~/fonctions/reservations/lister-jours-reservation";

export function calculerJoursReservation(ouverture: readonly CreneauOuverture[], maintenant: Date): JourReservation[] {
  return listerJoursReservation(maintenant).map((jour) => ({
    jour,
    ferme: estFermeCeJour(ouverture, jour),
    creneaux: listerCreneauxReservation(ouverture, jour, maintenant),
  }));
}
