// Connexion avec Apple ou Google, côté base (Prisma) : retrouver un compte par son « sub », lier un « sub » à un compte
// existant (même e-mail vérifié : le compte reste unique), lire comment un compte se connecte. La création passe par
// creerCompte (comptes.ts). Contrat des adresses : routes/comptes.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { FournisseurExterne } from "../fonctions/comptes/lire-identite-externe.ts";
import { estSansMotDePasse } from "../fonctions/comptes/est-sans-mot-de-passe.ts";
import { estDoublon } from "./comptes.ts";
import { CHAMP_SUB, type ConnexionsCompte, type ResultatRattachement, type ServicesComptesExternes } from "./comptes-externes-regles.ts";

export async function trouverCompteParSub(fournisseur: FournisseurExterne, sub: string): Promise<number | null> {
  const where = fournisseur === "apple" ? { appleSub: sub } : { googleSub: sub };
  return (await baseDeDonnees.compte.findUnique({ where, select: { id: true } }))?.id ?? null;
}

export async function rattacherSub(compteId: number, fournisseur: FournisseurExterne, sub: string, maintenant: Date): Promise<ResultatRattachement> {
  const champ = CHAMP_SUB[fournisseur];
  try {
    return await baseDeDonnees.$transaction(async (transaction) => {
      const { count } = await transaction.compte.updateMany({ where: { id: compteId, [champ]: null }, data: { [champ]: sub } });
      if (count === 0) return (await transaction.compte.count({ where: { id: compteId } })) === 0 ? "introuvable" : "deja-rattache";
      // Apple ou Google ont vérifié l'adresse : elle compte comme confirmée
      await transaction.compte.updateMany({ where: { id: compteId, emailVerifieLe: null }, data: { emailVerifieLe: maintenant } });
      return "ok";
    });
  } catch (erreur) {
    if (estDoublon(erreur)) return "sub-pris";
    throw erreur;
  }
}

export async function lireConnexions(compteId: number): Promise<ConnexionsCompte | null> {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { motDePasse: true, appleSub: true, googleSub: true } });
  return compte && { sansMotDePasse: estSansMotDePasse(compte.motDePasse), appleSub: compte.appleSub, googleSub: compte.googleSub };
}

export const servicesComptesExternes: ServicesComptesExternes = { trouverCompteParSub, rattacherSub, lireConnexions };
