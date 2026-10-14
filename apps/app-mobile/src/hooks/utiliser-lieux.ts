import { createContext, useContext } from "react";

import type { Lieu } from "@sos-miam/commun/types/lieu";

export type EtatLieux = {
  /** Tous les lieux connus (démo : les exemples ; sinon : les lieux publiés lus sur le serveur), avant le filtre d'âge */
  lieux: Lieu[];
  /** Un lieu par son identifiant, ou undefined s'il n'est pas dans la liste */
  trouverLieu: (id: number) => Lieu | undefined;
  /** Faux tant que rien n'est encore lu (ni la copie du téléphone, ni le serveur) */
  pret: boolean;
  source: "demo" | "serveur";
  /** Le serveur n'a pas répondu (la copie du téléphone reste affichée) */
  horsLigne: boolean;
  /** Relit la liste sur le serveur (tirer pour rafraîchir, retour dans l'app) */
  recharger: () => Promise<void>;
};

export const ContexteLieux = createContext<EtatLieux | null>(null);

/** Les lieux de l'app (FournisseurLieux) : la seule source, à filtrer ensuite selon l'âge (filtrerLieuxSelonAge). */
export function utiliserLieux(): EtatLieux {
  const valeur = useContext(ContexteLieux);
  if (!valeur) throw new Error("utiliserLieux doit être appelé sous <FournisseurLieux>.");
  return valeur;
}
