import { createContext, useContext } from "react";

import type { CategorieEnvie } from "@sos-miam/commun/types/profil";

/**
 * Comment le compte sera créé ou complété à la fin (« C'est prêt ») ; gardé en mémoire seulement, jamais sur le téléphone :
 * e-mail et mot de passe, jeton d'Apple ou de Google (valable 10 min chez Apple, 1 h chez Google), ou un compte déjà
 * connecté dont il faut compléter le profil (compte créé sur le site).
 */
export type ConnexionInscription =
  | { type: "email"; email: string; motDePasse: string }
  | { type: "apple"; identityToken: string; nonce: string }
  | { type: "google"; idToken: string }
  | { type: "completer" };

/** Ce que la personne a rempli pendant l'inscription, avant l'enregistrement final (écran « C'est prêt »). */
export type BrouillonInscription = {
  prenom: string;
  /** Pseudo pour que les potes te trouvent (sans « @ ») ; vide tant que rien n'est proposé ni tapé */
  pseudo: string;
  nom: string;
  /** AAAA-MM-JJ, null tant que rien n'est choisi */
  dateNaissance: string | null;
  ville: string | null;
  envies: Partial<Record<CategorieEnvie, string[]>>;
  /** null : profil gardé sur le téléphone seulement (démo, ou avant les comptes) */
  connexion: ConnexionInscription | null;
  /** La case « newsletter » de « C'est prêt » : cochée par défaut, décochable (lue seulement à la création du compte) */
  newsletter: boolean;
};

export type EtatBrouillon = {
  brouillon: BrouillonInscription;
  modifier: (changements: Partial<BrouillonInscription>) => void;
  /** Coche ou décoche un choix dans une catégorie d'envies */
  basculerEnvie: (categorie: CategorieEnvie, id: string) => void;
  /** Fin du verrou d'âge (« AAAA-MM-JJ ») si l'inscription est bloquée sur ce téléphone, sinon null */
  verrouAge: string | null;
  /** Vrai tant que le verrou n'a pas été lu (au début du parcours) */
  verrouEnLecture: boolean;
  /** Bloque l'inscription sur ce téléphone jusqu'à cette date (moins que l'âge minimum) */
  bloquer: (jusqua: string) => void;
  /** Lève le verrou : mode développement seulement (tests), jamais proposé dans l'app publiée */
  debloquer: () => void;
};

export const ContexteBrouillon = createContext<EtatBrouillon | null>(null);

/** Le brouillon de l'inscription en cours (fourni par FournisseurBrouillon, dans src/app/(inscription)/_layout.tsx). */
export function utiliserBrouillonInscription(): EtatBrouillon {
  const etat = useContext(ContexteBrouillon);
  if (!etat) throw new Error("utiliserBrouillonInscription doit être appelé sous <FournisseurBrouillon>.");
  return etat;
}
