import type { ChiffrementSocial, UsageTexteSocial } from "../../services/chiffrement-social.ts";

/**
 * Changement de clé (D.1 « Rotation », étape 9 du ménage) : un texte chiffré avec une ANCIENNE version de la clé des données,
 * relu puis réécrit avec la courante (même usage, même contexte). null : il est déjà à la clé courante, rien à faire. Lève
 * une erreur s'il ne se relit pas (illisible : laissé tel quel par l'appelant, sans rien citer au journal).
 */
export function rechiffrerTexteSocial(social: ChiffrementSocial, usage: UsageTexteSocial, contexte: string, chiffre: string): string | null {
  if (!social.estAncien(chiffre)) return null;
  return social.chiffrerTexte(usage, contexte, social.dechiffrerTexte(usage, contexte, chiffre));
}
