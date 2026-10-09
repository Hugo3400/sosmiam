// « ecouter » des services de l'API : l'API ne pousse rien (pas encore de notifications), alors les écrans abonnés sont
// prévenus à intervalle régulier, et seulement tant qu'il y en a au moins un (rien ne tourne quand personne n'écoute).

import type { Desabonner } from "../reponse-api.ts";

/** Une écoute partagée : tous les abonnés sont prévenus ensemble, toutes les `intervalleMs` millisecondes. */
export function creerEcouteReguliere(intervalleMs: number): (rappel: () => void) => Desabonner {
  const rappels = new Set<() => void>();
  let minuterie: ReturnType<typeof setInterval> | null = null;
  return (rappel) => {
    rappels.add(rappel);
    minuterie ??= setInterval(() => rappels.forEach((r) => r()), intervalleMs);
    return () => {
      rappels.delete(rappel);
      if (rappels.size === 0 && minuterie) {
        clearInterval(minuterie);
        minuterie = null;
      }
    };
  };
}
