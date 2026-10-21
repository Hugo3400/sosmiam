import { verifierDelaiReservation } from "@sos-miam/commun/fonctions/reservations/verifier-delai-reservation";
import type { CreneauDisponible, DelaiReservation } from "@sos-miam/commun/types/reglages-reservations";

export function garderCreneauxATemps(jour: string, creneaux: readonly CreneauDisponible[], delai: DelaiReservation, maintenantMs: number): CreneauDisponible[] {
  return creneaux.filter((creneau) => verifierDelaiReservation(delai, jour, creneau.heure, maintenantMs));
}
