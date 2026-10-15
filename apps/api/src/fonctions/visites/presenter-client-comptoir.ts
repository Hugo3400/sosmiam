import { EMOJI_AVATAR_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/avatar-par-defaut.ts";
import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";
import type { CompteVisiteur } from "../../services/visites-regles.ts";
import { choisirAvatarPublic, type AvatarDuCompte } from "../comptes/choisir-avatar-public.ts";
import { lireInitialeNom } from "./lire-initiale-nom.ts";

/** Ce que l'équipe d'un lieu voit d'un client : prénom, initiale du nom et avatar, jamais l'âge ni le nom complet */
export type ClientComptoir = { prenom: string; initialeNom: string | null; avatar: string };

export type CompteAuComptoir = CompteVisiteur & Partial<Pick<AvatarDuCompte, "photoProfil" | "limitations">>;

/**
 * Le client tel que le comptoir le montre (additions, récompenses, réservations) ; un compte effacé depuis : « Quelqu'un »
 * et 🙂. Sans avatar : l'avatar par défaut, le même que dans son app.
 */
export function presenterClientComptoir(compte: CompteAuComptoir | undefined, chiffrement: ChiffrementDonnees | null): ClientComptoir {
  const avatarPublic = compte?.limitations ? choisirAvatarPublic(compte) : compte?.avatar;
  const avatar = compte ? (avatarPublic ?? EMOJI_AVATAR_PAR_DEFAUT) : "🙂";
  return { prenom: compte?.prenom ?? "Quelqu'un", initialeNom: lireInitialeNom(compte?.nomChiffre ?? null, chiffrement), avatar };
}
