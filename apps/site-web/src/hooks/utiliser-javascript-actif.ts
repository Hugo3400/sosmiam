import { useSyncExternalStore } from "react";

const sansAbonnement = () => () => {};

/**
 * Faux au rendu serveur et pendant l'hydratation, vrai ensuite : de quoi montrer un bouton qui n'a de sens qu'avec
 * JavaScript (« Afficher quand même », « Choisir » en bouton) sans écart entre le HTML du serveur et le premier rendu.
 */
export function utiliserJavascriptActif(): boolean {
  return useSyncExternalStore(sansAbonnement, () => true, () => false);
}
