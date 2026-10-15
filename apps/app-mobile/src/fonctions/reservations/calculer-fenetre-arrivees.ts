import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";
import { VENU_APRES_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";

export function calculerFenetreArrivees(maintenantMs: number): { depuisMs: number; avantMs: number } {
  const aujourdhui = calculerJourParis(maintenantMs);
  const minuit = calculerInstantParis(aujourdhui, "00:00");
  return { depuisMs: Math.min(minuit, maintenantMs - VENU_APRES_CRENEAU_MS), avantMs: calculerInstantParis(decalerJour(aujourdhui, 1), "00:00") };
}
