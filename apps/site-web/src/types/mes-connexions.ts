// « Mes façons de me connecter » dans « Mon compte » : ce que la page reçoit (services/mes-connexions.server.ts).
import type { FournisseurExterne } from "~/types/connexion-externe";

export type MesConnexions = {
  /** Un vrai mot de passe, un compte Apple relié, un compte Google relié */
  motDePasse: boolean;
  apple: boolean;
  google: boolean;
  /** Les boutons réglés sur le site (Apple : seulement avec le Services ID) */
  actifs: Record<FournisseurExterne, boolean>;
  /**
   * Apple ou Google vient de confirmer (jeton gardé côté serveur, 10 minutes) : dernière étape par un bouton. « relier » :
   * relier `fournisseur` ; « delier » : `fournisseur` a confirmé, c'est l'AUTRE qu'on délie.
   */
  pret: { intention: "relier" | "delier"; fournisseur: FournisseurExterne } | null;
  /** Cette page, pour y revenir après Apple ou Google */
  depart: "/mon-compte" | "/espace/mon-compte";
  /** Le message d'un essai (réussi ou non) */
  message: { texte: string; reussite: boolean } | null;
  /** L'e-mail du compte (« Ajouter un mot de passe » y envoie le lien), et s'il s'agit d'une adresse masquée d'Apple */
  email: string;
  relaisApple: boolean;
};
