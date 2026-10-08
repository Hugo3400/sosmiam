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
};

export const ContexteActivite = createContext<EtatActivite | null>(null);

/** Rescousses de la semaine et lieux gardés (fourni par FournisseurActivite, dans les onglets). */
export function utiliserActivite(): EtatActivite {
  const etat = useContext(ContexteActivite);
  if (!etat) throw new Error("utiliserActivite doit être appelé sous <FournisseurActivite>.");
  return etat;
}
