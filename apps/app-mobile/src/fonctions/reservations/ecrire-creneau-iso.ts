import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";

export function ecrireCreneauIso(jour: string, heure: string): string {
  return new Date(calculerInstantParis(jour, heure)).toISOString();
}
