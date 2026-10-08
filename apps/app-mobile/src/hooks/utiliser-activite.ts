import { createContext, useContext } from "react";

/** Résultat d'un appui sur « rescousse » */
export type ResultatRescousse = "donnee" | "annulee" | "epuisee";

export type EtatActivite = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  aSauve: (idLieu: number) => boolean;
  estGarde: (idLieu: number) => boolean;
  /** Donne une rescousse au lieu, ou la reprend si elle était déjà donnée */
  basculerRescousse: (idLieu: number) => ResultatRescousse;
  /** Garde le lieu pour plus tard, ou l'enlève ; renvoie vrai s'il est maintenant gardé */
  basculerGarde: (idLieu: number) => boolean;
  aime: (idPublication: string) => boolean;
  /** Aime la publication, ou retire le J'aime ; renvoie vrai si elle est maintenant aimée */
  basculerJaime: (idPublication: string) => boolean;
  /** Aime la publication (double appui) sans jamais retirer le J'aime */
  aimer: (idPublication: string) => void;
  estMasquee: (idPublication: string) => boolean;
  masquer: (idPublication: string) => void;
};

export const ContexteActivite = createContext<EtatActivite | null>(null);

/** Rescousses de la semaine, lieux gardés, J'aime et publications masquées (fourni par FournisseurActivite, à la racine). */
export function utiliserActivite(): EtatActivite {
  const etat = useContext(ContexteActivite);
  if (!etat) throw new Error("utiliserActivite doit être appelé sous <FournisseurActivite>.");
  return etat;
}
