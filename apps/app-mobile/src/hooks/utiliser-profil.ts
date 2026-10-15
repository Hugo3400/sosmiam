import { createContext, useContext } from "react";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { Avatar } from "~/stockage/avatar-local";
import type { AnnonceSynchro } from "~/stockage/synchro-profil";

/** Ce que « Mes infos » change (seulement ce qui a bougé) ; nom "" : effacé */
export type ChangementsInfos = Partial<Pick<Profil, "prenom" | "pseudo" | "ville">> & { nom?: string };

/**
 * Pourquoi « Mes infos » n'a rien enregistré : un refus du serveur (texte dans MESSAGES_SERVICE : « pseudo-pris »,
 * « champ-invalide » avec son champ, « compte-limite »…), ou « pseudo-mis-de-cote » (ton ancien pseudo, retiré par
 * l'équipe), ou « pseudo-sans-reseau » (un nouveau pseudo doit être vérifié par le serveur : jamais mis en attente)
 */
export type RefusInfos = ErreurService | "pseudo-mis-de-cote" | "pseudo-sans-reseau";

/** parti : faux quand le changement attend le réseau sur le téléphone (il partira tout seul) */
/** parti faux : gardé sur le téléphone, il partira tout seul (`attente` : faute de réseau, ou le temps que le serveur se remette) */
export type ResultatInfos =
  | { ok: true; parti: true }
  | { ok: true; parti: false; attente: "reseau" | "serveur" }
  | { ok: false; refus: RefusInfos; champ?: string; details?: DetailsErreur };

export type EtatProfil = {
  /** null tant que la personne n'est pas inscrite */
  profil: Profil | null;
  /** Vrai pendant la lecture du profil au démarrage */
  chargement: boolean;
  /**
   * Vrai pendant une visite sans compte (« Juste jeter un œil ») : on regarde le fil, Explorer, les lieux et les créateurs,
   * le reste demande un compte (voir utiliserCompteRequis). Jamais vrai quand profil !== null. Âge inconnu : tout public.
   */
  invite: boolean;
  /**
   * Commence la visite sans compte (choix gardé sur le téléphone). Résout une fois les écrans de la visite ouverts
   * (on peut naviguer juste après) ; faux si un verrou d'âge est posé sur ce téléphone, ou si un profil existe déjà.
   */
  entrerEnInvite: () => Promise<boolean>;
  /** Arrête la visite sans compte (retour à l'inscription) */
  quitterInvite: () => Promise<void>;
  /**
   * Installe un profil complet (inscription, connexion, reprise après la démo) : il vient du serveur ou vient d'y partir,
   * donc rien ne part et les changements en attente sont oubliés. La visite sans compte, s'il y en avait une, s'arrête.
   * Pour changer un profil déjà là, c'est modifierInfos ou modifierEnvies.
   */
  enregistrer: (profil: Profil) => Promise<void>;
  /**
   * Mes infos (prénom, pseudo, nom, ville). Avec un compte, le serveur fait foi : on attend sa réponse (15 s au plus), et
   * sans réseau, le changement attend sur le téléphone (sauf le pseudo, qui doit être vérifié). En démo : sur le téléphone.
   */
  modifierInfos: (changements: ChangementsInfos) => Promise<ResultatInfos>;
  /** Mes envies : enregistrées tout de suite sur le téléphone ; avec un compte, elles partent ensuite (jamais les régimes) */
  modifierEnvies: (envies: Profil["envies"]) => Promise<void>;
  /** Ce que la carte du profil annonce (pseudo neutre de la modération…), une seule à la fois ; null : rien */
  annonce: AnnonceSynchro | null;
  /** L'annonce a été lue (« Compris », ou son bouton) : elle ne revient plus */
  fermerAnnonce: () => void;
  /** Ton ancien pseudo, retiré par l'équipe et réservé pour personne pendant 30 jours ; null : aucun */
  pseudoMisDeCote: string | null;
  /** Efface le profil, l'avatar, la synchro et la visite sans compte du téléphone (retour à la bienvenue) */
  effacer: () => Promise<void>;
  /** Emoji, Miami ou photo de profil (gardé à part du profil ; avec un compte, l'emoji ou le Miami suit sur le serveur) */
  avatar: Avatar;
  /**
   * Change d'avatar, tout de suite sur le téléphone ; l'ancienne photo, s'il y en avait une, en est supprimée. Avec un
   * compte (hors démo), un emoji ou un Miami part ensuite au serveur ; une photo, jamais
   */
  changerAvatar: (avatar: Avatar) => Promise<void>;
};

export const ContexteProfil = createContext<EtatProfil | null>(null);

/** Le profil de la personne et de quoi le changer (fourni par FournisseurProfil, à la racine de l'app). */
export function utiliserProfil(): EtatProfil {
  const etat = useContext(ContexteProfil);
  if (!etat) throw new Error("utiliserProfil doit être appelé sous <FournisseurProfil>.");
  return etat;
}
