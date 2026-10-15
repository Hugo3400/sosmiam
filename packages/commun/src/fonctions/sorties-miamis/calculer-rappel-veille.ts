import { HEURE_RAPPEL_VEILLE } from "../../regles/sorties-miamis.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";
import { calculerJourParis } from "../temps/calculer-jour-paris.ts";
import { decalerJour } from "../temps/decaler-jour.ts";

export function calculerRappelVeille(quandMs: number): number {
  const veille = decalerJour(calculerJourParis(quandMs), -1);
  return calculerInstantParis(veille, `${String(HEURE_RAPPEL_VEILLE).padStart(2, "0")}:00`);
}
