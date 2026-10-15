import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { DELAI_MIN_RESERVATION_MS } from "@sos-miam/commun/regles/reservations";

export function garderCreneauxATemps(jour: string, creneaux: readonly string[], maintenantMs: number): string[] {
  return creneaux.filter((heure) => calculerInstantParis(jour, heure) - maintenantMs >= DELAI_MIN_RESERVATION_MS);
}
