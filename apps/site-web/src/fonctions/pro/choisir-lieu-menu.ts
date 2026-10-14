import type { CompteConnecte } from "~/types/compte";

/**
 * Le lieu des liens du menu de l'espace pro : celui de l'adresse s'il est au compte et vérifié, sinon son premier lieu
 * vérifié ; null s'il n'en a aucun.
 */
export function choisirLieuMenu(compte: CompteConnecte, idAdresse: number): { id: number; gerant: boolean } | null {
  const valides = (compte.pro?.lieux ?? []).filter((lieu) => lieu.statut === "valide");
  const choisi = valides.find((lieu) => lieu.lieuId === idAdresse) ?? valides[0];
  return choisi ? { id: choisi.lieuId, gerant: choisi.role === "gerant" } : null;
}
