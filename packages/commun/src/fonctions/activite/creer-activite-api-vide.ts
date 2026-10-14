import { RESCOUSSES_PAR_SEMAINE } from "../../regles/rescousses.ts";
import type { ActiviteApi } from "../../types/activite.ts";
import { calculerProchainLundiParis } from "../temps/calculer-prochain-lundi-paris.ts";

/**
 * L'activité d'un compte qui n'a encore rien fait (ou tant que l'API n'a pas répondu) : 3 rescousses, rechargées au
 * prochain lundi à l'heure de Paris, et aucune liste. La semaine est inconnue (chaîne vide) : seule l'API la donne.
 */
export function creerActiviteApiVide(maintenantMs: number = Date.now()): ActiviteApi {
  return {
    semaine: "",
    restantes: RESCOUSSES_PAR_SEMAINE,
    rechargeLe: new Date(calculerProchainLundiParis(maintenantMs)).toISOString(),
    rescoussesSemaine: [],
    lieuxSauves: [],
    rescoussesDonnees: 0,
    rescoussesDuMois: 0,
    premiersSauvetages: [],
    gardes: [],
    jaimes: [],
    masques: [],
    suivis: [],
  };
}
