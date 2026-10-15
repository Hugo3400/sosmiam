import type { CreneauOuverture } from "../../types/lieu.ts";
import { listerCreneauxDisponibles } from "./lister-creneaux-disponibles.ts";

export function listerCreneauxReservation(ouverture: readonly CreneauOuverture[], jour: string, maintenant: Date): string[] {
  return listerCreneauxDisponibles({ ouverture, reglages: null, jour, maintenant }).map((c) => c.heure);
}
