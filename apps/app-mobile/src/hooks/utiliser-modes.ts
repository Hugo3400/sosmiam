import { createContext, useContext } from "react";

import type { LieuGere, ModeApp, RolesCompte } from "@sos-miam/commun/types/roles";

export type EtatModes = {
  /** Faux tant que le profil, les rôles et le dernier mode ne sont pas relus */
  pret: boolean;
  /** Rôles du compte (démo : ceux des Coulisses ; sans démo, aucun en attendant le compte unique) */
  roles: RolesCompte;
  /** Toujours « perso » en premier ; une visite sans compte n'a que « perso » */
  modesOuverts: ModeApp[];
  /** Lieu du mode pro (le dernier choisi, sinon le premier géré) ; null si le mode pro n'est pas ouvert */
  lieuPro: LieuGere | null;
  /** Change le lieu du mode pro (ignoré si ce lieu n'est pas géré) */
  choisirLieuPro: (lieuId: number) => void;
  /** Mémorise le mode pro (et le lieu s'il est donné), puis ouvre le Comptoir */
  entrerEnModePro: (lieuId?: number) => void;
  /** Mémorise le mode ambassadeur, puis ouvre l'Espace */
  entrerEnModeAmbassadeur: () => void;
  /** Mémorise le mode perso, puis revient au Profil (sous les écrans du mode) */
  revenirAuModePerso: () => void;
  /** Change les rôles joués dans la démo (Coulisses) ; null hors démo */
  changerRolesDemo: ((roles: RolesCompte) => Promise<void>) | null;
  rolesConnus: boolean;
  annulerRestauration: () => void;
};

export const ContexteModes = createContext<EtatModes | null>(null);

/**
 * Les modes de l'app (perso, pro, ambassadeur) et de quoi en changer, fournis par FournisseurModes à la racine.
 * Changer de mode ne donne aucun droit : le serveur (ou la démo) revérifie les rôles à chaque demande.
 */
export function utiliserModes(): EtatModes {
  const etat = useContext(ContexteModes);
  if (!etat) throw new Error("utiliserModes doit être appelé sous <FournisseurModes>.");
  return etat;
}
