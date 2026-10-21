import { createContext, useContext } from "react";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { LectureListe } from "~/hooks/utiliser-visites";

/**
 * Résultat d'un appui sur « rescousse », décidé tout de suite avec l'activité affichée (« non-verifie » : le lieu n'a pas
 * de compte SOS Miam, aucune rescousse comptée ; « sans-session » : le profil est là, mais plus la session du compte)
 */
export type ResultatRescousse = "donnee" | "annulee" | "epuisee" | "non-verifie" | "sans-session";

/**
 * La rescousse confirmée (ou pas) : par l'API avec un compte, tout de suite en démo. Seule cette réponse dit si tu es le
 * premier sauveteur. Un refus (pas de réseau, plus de rescousse…) défait le geste : l'activité affichée revient en arrière.
 */
export type FinRescousse = { ok: true; premierSauveteur: boolean } | { ok: false; erreur: ErreurService; details?: DetailsErreur };

export type EtatActivite = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  /** Rescousses données depuis l'inscription (et pas reprises) */
  rescoussesDonnees: number;
  /** Rescousses données ce mois-ci (à l'heure de Paris avec un compte ; semaines commencées ce mois-ci en démo), pour le classement entre potes */
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
  /**
   * Vrai une fois l'activité connue : relue sur le téléphone (démo, ou copie du compte), sinon après la première lecture
   * de l'API, même ratée ; tout de suite en visite sans compte. Avant : une activité vide.
   */
  chargee: boolean;
  lectureActivite: LectureListe;
  /** Vrai quand la dernière demande à l'API n'a pas eu de réponse (les gestes attendent le réseau, sauf les rescousses) */
  horsLigne: boolean;
  /**
   * Publications aimées d'après la dernière réponse de l'API, sans les gestes pas encore partis ; null tant qu'on ne la
   * connaît pas. Le nombre de J'aime de l'API compte déjà le tien : le fil s'en sert pour ne pas le compter deux fois.
   * Vide en démo et en visite (les compteurs ne comptent jamais le tien).
   */
  jaimesServeur: readonly string[] | null;
  aSauve: (idLieu: number) => boolean;
  estGarde: (idLieu: number) => boolean;
  /**
   * Donne une rescousse au lieu (vérifié seulement), ou la reprend si elle était déjà donnée. La réponse est immédiate ;
   * surFin arrive avec la confirmation (premier sauveteur ou refus). Voir utiliserGesteRescousse, qui dit tout ça.
   */
  basculerRescousse: (lieu: Lieu, surFin?: (fin: FinRescousse) => void) => ResultatRescousse;
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
  /** Efface l'activité gardée sur le téléphone (démo et copie du compte, sans rien demander au serveur) */
  effacer: () => Promise<void>;
};

export const ContexteActivite = createContext<EtatActivite | null>(null);

/**
 * Rescousses de la semaine, lieux gardés, J'aime, publications masquées et suivis (fourni par FournisseurActivite, à la
 * racine) : ceux de la démo sur le téléphone, ou ceux du compte connecté sur l'API.
 */
export function utiliserActivite(): EtatActivite {
  const etat = useContext(ContexteActivite);
  if (!etat) throw new Error("utiliserActivite doit être appelé sous <FournisseurActivite>.");
  return etat;
}
