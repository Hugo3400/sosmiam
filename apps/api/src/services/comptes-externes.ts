// Connexion avec Apple ou Google, côté base (Prisma) : retrouver un compte par son « sub », lier un « sub » à un compte
// existant (même e-mail vérifié : le compte reste unique), le délier depuis « Mon compte », lire comment un compte se connecte. La création passe par
// creerCompte (comptes.ts). Contrat des adresses : routes/comptes.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { FournisseurExterne } from "../fonctions/comptes/lire-identite-externe.ts";
import { estSansMotDePasse } from "../fonctions/comptes/est-sans-mot-de-passe.ts";
import { creerEmpreinteSansMotDePasse, PREFIXE_SANS_MOT_DE_PASSE } from "../fonctions/securite/creer-empreinte-sans-mot-de-passe.ts";
import { estDoublon } from "./comptes.ts";
import {
  CHAMP_SUB, type ConnexionsCompte, type ResultatDeliement, type ResultatRattachement, type ResultatReprise, type ServicesComptesExternes,
} from "./comptes-externes-regles.ts";

export async function trouverCompteParSub(fournisseur: FournisseurExterne, sub: string): Promise<number | null> {
  const where = fournisseur === "apple" ? { appleSub: sub } : { googleSub: sub };
  return (await baseDeDonnees.compte.findUnique({ where, select: { id: true } }))?.id ?? null;
}

export async function rattacherSub(
  compteId: number, fournisseur: FournisseurExterne, sub: string, maintenant: Date, confirmerEmail = true,
): Promise<ResultatRattachement> {
  const champ = CHAMP_SUB[fournisseur];
  try {
    return await baseDeDonnees.$transaction(async (transaction) => {
      const { count } = await transaction.compte.updateMany({ where: { id: compteId, [champ]: null }, data: { [champ]: sub } });
      if (count === 0) return (await transaction.compte.count({ where: { id: compteId } })) === 0 ? "introuvable" : "deja-rattache";
      // Apple ou Google ont vérifié l'adresse : elle compte comme confirmée
      if (confirmerEmail) await transaction.compte.updateMany({ where: { id: compteId, emailVerifieLe: null }, data: { emailVerifieLe: maintenant } });
      return "ok";
    });
  } catch (erreur) {
    if (estDoublon(erreur)) return "sub-pris";
    throw erreur;
  }
}

export async function reprendreCompteNonConfirme(
  compteId: number, fournisseur: FournisseurExterne, sub: string, maintenant: Date,
): Promise<ResultatReprise> {
  const autre = CHAMP_SUB[fournisseur === "apple" ? "google" : "apple"];
  try {
    const { count } = await baseDeDonnees.compte.updateMany({
      where: { id: compteId, emailVerifieLe: null },
      data: {
        [CHAMP_SUB[fournisseur]]: sub, [autre]: null, motDePasse: creerEmpreinteSansMotDePasse(), emailVerifieLe: maintenant,
        jetonReinitialisation: null, jetonExpireLe: null,
      },
    });
    if (count === 1) return "ok";
    return (await baseDeDonnees.compte.count({ where: { id: compteId } })) === 0 ? "introuvable" : "confirme";
  } catch (erreur) {
    if (estDoublon(erreur)) return "sub-pris";
    throw erreur;
  }
}

/**
 * Délie Apple ou Google en UNE écriture conditionnelle : seulement si le compte garde un vrai mot de passe ou l'autre
 * fournisseur. Deux « délier » lancés en même temps (Apple et Google d'un compte sans mot de passe) ne passent donc
 * jamais tous les deux.
 */
export async function delierSub(compteId: number, fournisseur: FournisseurExterne): Promise<ResultatDeliement> {
  const resteUnMoyen = [{ NOT: { motDePasse: { startsWith: PREFIXE_SANS_MOT_DE_PASSE } } }, fournisseur === "apple" ? { googleSub: { not: null } } : { appleSub: { not: null } }];
  const relie = fournisseur === "apple" ? { appleSub: { not: null } } : { googleSub: { not: null } };
  const { count } = await baseDeDonnees.compte.updateMany({ where: { id: compteId, ...relie, OR: resteUnMoyen }, data: { [CHAMP_SUB[fournisseur]]: null } });
  if (count === 1) return "ok";
  const connexions = await lireConnexions(compteId);
  if (!connexions) return "introuvable";
  return (fournisseur === "apple" ? connexions.appleSub : connexions.googleSub) === null ? "non-relie" : "derniere-connexion";
}

export async function lireConnexions(compteId: number): Promise<ConnexionsCompte | null> {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { motDePasse: true, appleSub: true, googleSub: true } });
  return compte && { sansMotDePasse: estSansMotDePasse(compte.motDePasse), appleSub: compte.appleSub, googleSub: compte.googleSub };
}

export const servicesComptesExternes: ServicesComptesExternes = { trouverCompteParSub, rattacherSub, reprendreCompteNonConfirme, delierSub, lireConnexions };
