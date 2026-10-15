import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import { JOURS_RESERVATION_MAX } from "@sos-miam/commun/regles/reservations";

export function listerJoursReservation(maintenant: Date): string[] {
  const aujourdhui = calculerJourParis(maintenant.getTime());
  return Array.from({ length: JOURS_RESERVATION_MAX + 1 }, (_, ecart) => decalerJour(aujourdhui, ecart));
}
