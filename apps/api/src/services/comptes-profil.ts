// Profil de l'app gardé sur le serveur (décidé le 8 et le 9 octobre 2026, docs/decisions.md) : prénom, nom et date de
// naissance (CHIFFRÉS par l'API avant d'arriver ici), pseudo unique, ville, envies (jamais les régimes), avatar emoji,
// compte privé. Contrat des adresses : routes/comptes.ts ; lecture et vérifications : controleurs/comptes-profil.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { estDoublonPseudo } from "./comptes.ts";

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

/** Écrit le profil ; « pseudo-pris » si un autre compte a déjà ce pseudo (contrainte unique de la base). */
export async function modifierProfil(id: number, modification: ModificationProfil): Promise<"ok" | "pseudo-pris"> {
  try {
    await baseDeDonnees.compte.updateMany({ where: { id }, data: modification });
    return "ok";
  } catch (erreur) {
    if (estDoublonPseudo(erreur)) return "pseudo-pris";
    throw erreur;
  }
}

/** Vrai si un AUTRE compte que `saufCompteId` a déjà ce pseudo. */
export async function pseudoEstPris(pseudo: string, saufCompteId?: number): Promise<boolean> {
  const trouve = await baseDeDonnees.compte.findUnique({ where: { pseudo }, select: { id: true } });
  return trouve !== null && trouve.id !== saufCompteId;
}
