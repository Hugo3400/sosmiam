import { createContext, useContext } from "react";

import type { SourceServices } from "@sos-miam/commun/client-api/services";
import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import type { Visite } from "@sos-miam/commun/types/visite";

export type EtatVisites = {
  /** Faux jusqu'à la première lecture (vrai tout de suite sans compte : il n'y a rien à lire) */
  pret: boolean;
  /** D'où viennent les données : la démo, l'API, ou rien encore (version publiée sans comptes) */
  source: SourceServices;
  /** Ta demande d'addition en attente, s'il y en a une */
  enCours: Visite | null;
  /** Tes visites, de la plus récente à la plus ancienne (telles que les services les rendent) */
  visites: Visite[];
  /** Visites dont l'avis est ouvert et pas encore donné */
  aEcrire: Visite[];
  cartes: CarteFidelite[];
  reservations: Reservation[];
  /** Points des visites et des avis avec photo (à ajouter aux points comptés sur le téléphone, voir utiliserPointsTotaux) */
  points: number;
  /** Relit tout ; ce qui n'a pas pu être relu (pas de réseau…) garde sa dernière valeur */
  rafraichir: () => Promise<void>;
};

export const ContexteVisites = createContext<EtatVisites | null>(null);

/**
 * Tes visites, ta demande en cours, tes cartes de fidélité, tes réservations et tes avis à donner, fournis par
 * FournisseurVisites : relus quand les services préviennent d'un changement et à chaque retour au premier plan.
 */
export function utiliserVisites(): EtatVisites {
  const etat = useContext(ContexteVisites);
  if (!etat) throw new Error("utiliserVisites doit être appelé sous <FournisseurVisites>.");
  return etat;
}
