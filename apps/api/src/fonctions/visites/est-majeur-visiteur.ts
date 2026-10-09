import { calculerAgeProfil } from "../comptes/calculer-age-profil.ts";
import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";

/** Âge des rôles, des bars et de l'alcool (AGE_ALCOOL de packages/commun) */
const AGE_MAJEUR = 18;

/**
 * Ce compte a-t-il 18 ans ou plus, pour les visites (bars, récompenses avec alcool) et le comptoir (rôles pro) ?
 * - sans date gardée : compte créé sur le site, où 18 ans sont demandés à l'inscription (la date n'y est pas gardée) ;
 * - date gardée mais illisible (pas de clé, clé fausse) : non, par prudence (comme presenterCompte, qui masque les rôles).
 */
export function estMajeurVisiteur(dateNaissanceChiffree: string | null, chiffrement: ChiffrementDonnees | null, maintenant: Date): boolean {
  if (dateNaissanceChiffree === null) return true;
  if (!chiffrement) return false;
  try {
    const age = calculerAgeProfil(chiffrement.dechiffrer(dateNaissanceChiffree, "dateNaissance"), maintenant);
    return age !== null && age >= AGE_MAJEUR;
  } catch {
    return false;
  }
}
