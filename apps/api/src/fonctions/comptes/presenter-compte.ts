import type { CompteConnecte, CompteLu } from "../../services/comptes.ts";

/** Les rôles ambassadeur et pro ne sont jamais rendus sous cet âge (docs/decisions.md : espace ambassadeur dès 18 ans) */
export const AGE_ROLES = 18;

/**
 * Le compte tel que la personne connectée le voit (contrat de routes/comptes.ts) : `age` (null si la date de naissance
 * n'est pas gardée), `pro.lieuxValides` (seulement les rattachements « valide »), et AUCUN rôle (ambassadeur null, listes
 * pro vides) si l'âge connu est sous 18 ans, ou si la date est gardée mais illisible (clé de chiffrement absente) :
 * dans le doute, on ne montre pas. La date chiffrée ne sort jamais.
 */
export function presenterCompte(compte: CompteLu, age: number | null, dateIllisible = false): CompteConnecte {
  const { dateNaissanceChiffree: _date, pro, ambassadeur, ...reste } = compte;
  const sansRoles = age !== null ? age < AGE_ROLES : dateIllisible;
  if (sansRoles) return { ...reste, age, ambassadeur: null, pro: { lieux: [], lieuxValides: [] } };
  return { ...reste, age, ambassadeur, pro: { lieux: pro.lieux, lieuxValides: pro.lieux.filter((lieu) => lieu.statut === "valide") } };
}
