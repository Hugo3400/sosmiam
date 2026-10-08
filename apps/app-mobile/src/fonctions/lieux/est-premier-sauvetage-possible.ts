import type { Lieu } from "@sos-miam/commun/types/lieu";

/**
 * Vrai si la rescousse donnée maintenant à ce lieu fait de la personne son « premier sauveteur » (badge et points) :
 * un lieu tout juste arrivé, que personne n'a encore fait découvrir, et pas déjà compté pour elle
 * (les rescousses reviennent chaque lundi, le titre ne s'annonce qu'une fois). Même règle pour le fil et la fiche lieu.
 */
export function estPremierSauvetagePossible(lieu: Lieu, premiersSauvetages: number[]): boolean {
  return !!lieu.nouveau && !lieu.decouvertPar && !premiersSauvetages.includes(lieu.id);
}
