import { createContext, useContext } from "react";

import type { Lieu } from "@sos-miam/commun/types/lieu";

/** Résultat d'un appui sur « rescousse » (« non-verifie » : le lieu n'a pas de compte SOS Miam, aucune rescousse comptée) */
export type ResultatRescousse = "donnee" | "annulee" | "epuisee" | "non-verifie";

export type EtatActivite = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  /** Rescousses données depuis l'inscription (et pas reprises) */
  rescoussesDonnees: number;
  /** Rescousses données ce mois-ci (semaines commencées ce mois-ci), pour le classement entre potes */
  rescoussesDuMois: number;
  /** Lieux sauvés au moins une fois, du plus récent au plus ancien */
  lieuxSauves: number[];
  /** Lieux dont la personne a été le premier sauveteur */
  premiersSauvetages: number[];
  /** Lieux gardés (🔖), du plus récent au plus ancien */
  gardes: number[];
  /** Publications aimées (❤️), de la plus récente à la plus ancienne */
  jaimes: string[];
  /** Lieux et créateurs suivis (« lieu:<id> », « createur:<pseudo> », voir calculerCleSuivi), du plus récent au plus ancien */
  suivis: string[];
  /** Vrai une fois l'activité du téléphone relue (avant : une activité vide) */
  chargee: boolean;
  aSauve: (idLieu: number) => boolean;
  estGarde: (idLieu: number) => boolean;
  /** Donne une rescousse au lieu (vérifié seulement), ou la reprend si elle était déjà donnée */
  basculerRescousse: (lieu: Pick<Lieu, "id" | "verifie">) => ResultatRescousse;
  /** Garde le lieu pour plus tard, ou l'enlève ; renvoie vrai s'il est maintenant gardé */
  basculerGarde: (idLieu: number) => boolean;
  aime: (idPublication: string) => boolean;
  /** Aime la publication, ou retire le J'aime ; renvoie vrai si elle est maintenant aimée */
  basculerJaime: (idPublication: string) => boolean;
  /** Aime la publication (double appui) sans jamais retirer le J'aime */
  aimer: (idPublication: string) => void;
  estMasquee: (idPublication: string) => boolean;
  masquer: (idPublication: string) => void;
  estSuivi: (cle: string) => boolean;
  /** Suit le lieu ou le créateur, ou arrête de le suivre ; renvoie vrai s'il est maintenant suivi */
  basculerSuivi: (cle: string) => boolean;
  /** Note que la personne est la première à sauver ce lieu (badge et points « Premier sauveteur ») */
  noterPremierSauvetage: (idLieu: number) => void;
  /** Efface toute l'activité (téléphone compris) */
  effacer: () => Promise<void>;
};

export const ContexteActivite = createContext<EtatActivite | null>(null);

/** Rescousses de la semaine, lieux gardés, J'aime, publications masquées et suivis (fourni par FournisseurActivite, à la racine). */
export function utiliserActivite(): EtatActivite {
  const etat = useContext(ContexteActivite);
  if (!etat) throw new Error("utiliserActivite doit être appelé sous <FournisseurActivite>.");
  return etat;
}
