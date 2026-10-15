import { DELAIS_RESERVATION_MS } from "../../regles/reglages-reservations.ts";
import type { DelaiReservation } from "../../types/reglages-reservations.ts";
import { calculerEcartJoursParis } from "../temps/calculer-ecart-jours-paris.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";

export function verifierDelaiReservation(delai: DelaiReservation, jour: string, heure: string, maintenantMs: number): boolean {
  const instant = calculerInstantParis(jour, heure);
  if (Number.isNaN(instant) || Number.isNaN(maintenantMs)) return false;
  if (delai === "veille") return (calculerEcartJoursParis(jour, maintenantMs) ?? 0) >= 1;
  return instant - maintenantMs >= DELAIS_RESERVATION_MS[delai];
}
