// Connexion avec Apple ou Google en mémoire (tests, API de démonstration) : mêmes règles que comptes-externes.ts, sur les
// comptes de comptes-en-memoire.ts.
import { estSansMotDePasse } from "../fonctions/comptes/est-sans-mot-de-passe.ts";
import type { CompteEnMemoire } from "./comptes-en-memoire.ts";
import { CHAMP_SUB, type ServicesComptesExternes } from "./comptes-externes-regles.ts";

export function creerComptesExternesEnMemoire(comptes: Map<number, CompteEnMemoire>): ServicesComptesExternes {
  const trouver = (champ: "appleSub" | "googleSub", sub: string) => [...comptes.values()].find((compte) => compte[champ] === sub);
  return {
    async trouverCompteParSub(fournisseur, sub) {
      return trouver(CHAMP_SUB[fournisseur], sub)?.id ?? null;
    },
    async rattacherSub(compteId, fournisseur, sub, maintenant) {
      const champ = CHAMP_SUB[fournisseur];
      const compte = comptes.get(compteId);
      if (!compte) return "introuvable";
      if (compte[champ]) return "deja-rattache";
      if (trouver(champ, sub)) return "sub-pris";
      compte[champ] = sub;
      compte.emailVerifieLe ??= maintenant.getTime();
      return "ok";
    },
    async lireConnexions(compteId) {
      const compte = comptes.get(compteId);
      return compte ? { sansMotDePasse: estSansMotDePasse(compte.motDePasse), appleSub: compte.appleSub ?? null, googleSub: compte.googleSub ?? null } : null;
    },
  };
}
