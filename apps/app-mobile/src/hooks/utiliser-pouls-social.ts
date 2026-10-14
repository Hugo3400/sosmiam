import { createContext, useContext } from "react";

import type { PoulsSocial } from "@sos-miam/commun/types/social";

export type ValeurPoulsSocial = {
  /**
   * Le dernier pouls lu (GET /app/social/pouls) : petits compteurs et signatures. Un fournisseur « compte » relit ses données
   * quand la signature qui le concerne change (à comparer par l'égalité, rien d'autre). null : pas de compte connecté, mode
   * démo, ou pas encore lu. Le même objet tant que rien ne bouge : un pouls identique ne fait rien redessiner.
   */
  pouls: PoulsSocial | null;
  /** Relit le pouls tout de suite (après un geste, une notification reçue) ; sans effet hors compte ou en arrière-plan */
  relire: () => void;
};

export const ContextePoulsSocial = createContext<ValeurPoulsSocial | null>(null);

/** Le pouls de la partie sociale (compte connecté, app au premier plan), fourni par FournisseurPoulsSocial. */
export function utiliserPoulsSocial(): ValeurPoulsSocial {
  const valeur = useContext(ContextePoulsSocial);
  if (!valeur) throw new Error("utiliserPoulsSocial doit être appelé sous <FournisseurPoulsSocial>.");
  return valeur;
}
