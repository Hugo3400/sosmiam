import { createContext, useContext } from "react";

import type { Profil } from "@sos-miam/commun/types/profil";
import type { Avatar } from "~/stockage/avatar-local";

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
  /** Enregistre le profil ; la visite sans compte, s'il y en avait une, s'arrête */
  enregistrer: (profil: Profil) => Promise<void>;
  /** Efface le profil, l'avatar et la visite sans compte du téléphone (retour à la bienvenue) */
  effacer: () => Promise<void>;
  /** Emoji ou photo de profil (gardé à part : ce n'est pas une donnée du compte) */
  avatar: Avatar;
  /** Change d'avatar ; l'ancienne photo, s'il y en avait une, est supprimée du téléphone */
  changerAvatar: (avatar: Avatar) => Promise<void>;
};

export const ContexteProfil = createContext<EtatProfil | null>(null);

/** Le profil de la personne et de quoi le changer (fourni par FournisseurProfil, à la racine de l'app). */
export function utiliserProfil(): EtatProfil {
  const etat = useContext(ContexteProfil);
  if (!etat) throw new Error("utiliserProfil doit être appelé sous <FournisseurProfil>.");
  return etat;
}
