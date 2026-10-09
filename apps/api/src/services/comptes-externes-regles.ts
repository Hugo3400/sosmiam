// Ce que la connexion avec Apple ou Google demande aux données (sans rien importer qui touche à la base : le double en
// mémoire s'en sert aussi). La base : comptes-externes.ts ; la mémoire : comptes-externes-en-memoire.ts.
import type { FournisseurExterne } from "../fonctions/comptes/lire-identite-externe.ts";

/** Colonne du compte qui garde le « sub » de chaque fournisseur */
export const CHAMP_SUB = { apple: "appleSub", google: "googleSub" } as const satisfies Record<FournisseurExterne, string>;

/** Comment le compte se connecte : vrai mot de passe ou non, et ses identifiants Apple et Google (null : jamais liés) */
export type ConnexionsCompte = { sansMotDePasse: boolean; appleSub: string | null; googleSub: string | null };

/** « deja-rattache » : le compte a déjà un AUTRE identifiant chez ce fournisseur ; « sub-pris » : un autre compte a pris
 * cet identifiant au même moment ; « introuvable » : le compte n'existe plus */
export type ResultatRattachement = "ok" | "deja-rattache" | "sub-pris" | "introuvable";

export type ServicesComptesExternes = {
  /** Le compte lié à cet identifiant Apple ou Google, ou null */
  trouverCompteParSub: (fournisseur: FournisseurExterne, sub: string) => Promise<number | null>;
  /** Lie l'identifiant au compte (s'il n'en a pas encore chez ce fournisseur), et note l'e-mail comme vérifié s'il ne l'était pas */
  rattacherSub: (compteId: number, fournisseur: FournisseurExterne, sub: string, maintenant: Date) => Promise<ResultatRattachement>;
  lireConnexions: (compteId: number) => Promise<ConnexionsCompte | null>;
};
