import { createContext, useContext } from "react";

/** Ce que la personne voulait faire quand on lui demande de créer son compte (titre et phrase : src/contenus/raisons-compte.ts). */
export type RaisonCompte =
  | "rescousse"
  | "jaime"
  | "commenter"
  | "suivre"
  | "garder"
  | "partager"
  | "envoyer"
  | "masquer"
  | "signaler"
  | "potes"
  | "profil"
  | "scan"
  | "defis"
  | "miam-safe"
  | "proposer";

/** Vrai si la personne a un compte ; sinon, ouvre la feuille « Crée ton compte » pour cette raison et renvoie faux. */
export type ExigerCompte = (raison: RaisonCompte) => boolean;

export const ContexteCompteRequis = createContext<ExigerCompte | null>(null);

/**
 * À appeler au début de chaque geste réservé aux inscrits : `if (!exigerCompte("jaime")) return;`.
 * La fonction rendue reste la même d'un rendu à l'autre (elle peut servir dans des gestes mémorisés).
 * Fournie par FournisseurInvite, à la racine de l'app.
 */
export function utiliserCompteRequis(): ExigerCompte {
  const exiger = useContext(ContexteCompteRequis);
  if (!exiger) throw new Error("utiliserCompteRequis doit être appelé sous <FournisseurInvite>.");
  return exiger;
}
