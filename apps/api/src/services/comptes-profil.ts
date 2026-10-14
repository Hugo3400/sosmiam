// Profil de l'app gardé sur le serveur (décidé le 8 et le 9 octobre 2026, docs/decisions.md) : prénom, nom et date de
// naissance (CHIFFRÉS par l'API avant d'arriver ici), pseudo unique, ville, envies (jamais les régimes), avatar emoji,
// compte privé. Contrat des adresses : routes/comptes.ts ; lecture et vérifications : controleurs/comptes-profil.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { estDoublonPseudo } from "./comptes.ts";
import { estReservePourUnAutre, reserverPseudoDans, tablePseudosReservesPresente } from "./pseudos-reserves.ts";

/** Le profil tel que la base le garde : nom et date encore chiffrés (null : pas donnés, ou compte du site) */
export type ProfilLu = {
  prenom: string;
  nomChiffre: string | null;
  pseudo: string | null;
  dateNaissanceChiffree: string | null;
  /** Ville du profil de l'app (null : compte du site, dont la ville est sur sa fiche d'ambassadeur) */
  ville: string | null;
  /** Tel que gardé (un objet { categorie: [ids] }, ou null) : relu et filtré par le contrôleur */
  envies: unknown;
  avatar: string | null;
  prive: boolean;
  emailVerifie: boolean;
};

/** Ce que la personne change elle-même (jamais la date de naissance) ; nomChiffre et avatar null : effacés */
export type ModificationProfil = {
  prenom?: string;
  nomChiffre?: string | null;
  pseudo?: string;
  ville?: string;
  envies?: Record<string, string[]>;
  avatar?: string | null;
  prive?: boolean;
  /** Seulement pour un compte qui n'en a aucune (compte du site arrivé dans l'app) ; jamais remplacée ici */
  dateNaissanceChiffree?: string;
};

export async function lireProfil(id: number): Promise<ProfilLu | null> {
  const compte = await baseDeDonnees.compte.findUnique({
    where: { id },
    select: {
      prenom: true, nomChiffre: true, pseudo: true, dateNaissanceChiffree: true, ville: true, envies: true, avatar: true, prive: true,
      emailVerifieLe: true,
    },
  });
  if (!compte) return null;
  const { emailVerifieLe, ...reste } = compte;
  return { ...reste, emailVerifie: emailVerifieLe !== null };
}

/**
 * Écrit le profil ; « pseudo-pris » si un autre compte a déjà ce pseudo (contrainte unique de la base) ou s'il est réservé
 * pour un autre (pseudos-reserves.ts). Changement de pseudo : l'ancien est réservé 30 jours pour ce compte, dans la même
 * transaction ; reprendre un pseudo réservé pour soi retire la réservation.
 */
export async function modifierProfil(id: number, modification: ModificationProfil, maintenant = new Date()): Promise<"ok" | "pseudo-pris"> {
  try {
    if (modification.pseudo === undefined || !(await tablePseudosReservesPresente())) {
      await baseDeDonnees.compte.updateMany({ where: { id }, data: modification });
      return "ok";
    }
    const nouveau = modification.pseudo;
    return await baseDeDonnees.$transaction(async (transaction) => {
      const actuel = await transaction.compte.findUnique({ where: { id }, select: { pseudo: true } });
      if (!actuel) return "ok";
      if (actuel.pseudo !== nouveau) {
        if (await estReservePourUnAutre(transaction, nouveau, id, maintenant)) return "pseudo-pris";
        await transaction.pseudoReserve.deleteMany({ where: { pseudo: nouveau } });
        if (actuel.pseudo !== null) await reserverPseudoDans(transaction, actuel.pseudo, id, "changement", maintenant);
      }
      await transaction.compte.updateMany({ where: { id }, data: modification });
      return "ok" as const;
    });
  } catch (erreur) {
    if (estDoublonPseudo(erreur)) return "pseudo-pris";
    throw erreur;
  }
}

/**
 * Vrai si un AUTRE compte que `saufCompteId` a déjà ce pseudo, ou s'il est réservé (pas expiré) pour un autre compte ou
 * pour personne (compte supprimé) : réservé pour soi, il est libre.
 */
export async function pseudoEstPris(pseudo: string, saufCompteId?: number, maintenant = new Date()): Promise<boolean> {
  const trouve = await baseDeDonnees.compte.findUnique({ where: { pseudo }, select: { id: true } });
  if (trouve !== null) return trouve.id !== saufCompteId;
  return (await tablePseudosReservesPresente()) && (await estReservePourUnAutre(baseDeDonnees, pseudo, saufCompteId, maintenant));
}
