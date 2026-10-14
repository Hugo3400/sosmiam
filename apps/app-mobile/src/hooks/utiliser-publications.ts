import { createContext, useContext } from "react";

import type { Publication } from "~/contenus/type-publication";

export type EtatPublications = {
  /** Les publications connues (démo : les exemples ; sinon : celles lues sur le serveur, page après page) */
  publications: Publication[];
  trouverPublication: (id: string) => Publication | undefined;
  /** Faux tant que rien n'est encore lu (ni la copie du téléphone, ni le serveur) */
  pret: boolean;
  source: "demo" | "serveur";
  /** Le serveur n'a pas répondu (la copie du téléphone reste affichée) */
  horsLigne: boolean;
  /** Il reste des pages plus anciennes sur le serveur */
  aUneSuite: boolean;
  /** Lit la page suivante (rien si tout est lu, ou si une lecture est en cours) */
  chargerSuite: () => Promise<void>;
  /** Relit le fil depuis le début (tirer pour rafraîchir, retour dans l'app) */
  recharger: () => Promise<void>;
};

export const ContextePublications = createContext<EtatPublications | null>(null);

/** Les publications du fil (FournisseurPublications) : la seule source, à filtrer ensuite (lieux permis, masquées). */
export function utiliserPublications(): EtatPublications {
  const valeur = useContext(ContextePublications);
  if (!valeur) throw new Error("utiliserPublications doit être appelé sous <FournisseurPublications>.");
  return valeur;
}
