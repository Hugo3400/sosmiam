import { useSyncExternalStore } from "react";

import { ecouterFeuillesOuvertes, trouverFeuilleOuverte } from "~/services/feuilles-ouvertes";

const lireOuverte = () => trouverFeuilleOuverte() !== null;

/** Vrai tant qu'une feuille inscrite (services/feuilles-ouvertes) est ouverte quelque part dans l'app */
export function utiliserFeuilleOuverte(): boolean {
  return useSyncExternalStore(ecouterFeuillesOuvertes, lireOuverte, lireOuverte);
}
