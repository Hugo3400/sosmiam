import { createContext, useContext } from "react";

import type { CategorieEnvie } from "@sos-miam/commun/types/profil";

/** Ce que la personne a rempli pendant l'inscription, avant l'enregistrement final (écran « C'est prêt »). */
export type BrouillonInscription = {
  prenom: string;
  nom: string;
  /** AAAA-MM-JJ, null tant que rien n'est choisi */
  dateNaissance: string | null;
  ville: string | null;
  envies: Partial<Record<CategorieEnvie, string[]>>;
};

export type EtatBrouillon = {
  brouillon: BrouillonInscription;
  modifier: (changements: Partial<BrouillonInscription>) => void;
  /** Coche ou décoche un choix dans une catégorie d'envies */
  basculerEnvie: (categorie: CategorieEnvie, id: string) => void;
};

export const ContexteBrouillon = createContext<EtatBrouillon | null>(null);

/** Le brouillon de l'inscription en cours (fourni par FournisseurBrouillon, dans src/app/(inscription)/_layout.tsx). */
export function utiliserBrouillonInscription(): EtatBrouillon {
  const etat = useContext(ContexteBrouillon);
  if (!etat) throw new Error("utiliserBrouillonInscription doit être appelé sous <FournisseurBrouillon>.");
  return etat;
}
