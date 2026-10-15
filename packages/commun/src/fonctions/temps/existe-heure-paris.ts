import { calculerInstantParis } from "./calculer-instant-paris.ts";
import { calculerJourParis } from "./calculer-jour-paris.ts";
import { lireHeureParis } from "./lire-heure-paris.ts";

export function existeHeureParis(jour: string, heure: string): boolean {
  const instant = calculerInstantParis(jour, heure);
  if (Number.isNaN(instant)) return false;
  return calculerJourParis(instant) === jour && lireHeureParis(instant) === heure;
}
