import { calculerInstantParis } from "./calculer-instant-paris.ts";
import { calculerJourParis } from "./calculer-jour-paris.ts";
import { calculerProchainLundiParis } from "./calculer-prochain-lundi-paris.ts";
import { decalerJour } from "./decaler-jour.ts";

export function calculerDernierLundiParis(instantMs: number): number {
  return calculerInstantParis(decalerJour(calculerJourParis(calculerProchainLundiParis(instantMs)), -7), "00:00");
}
