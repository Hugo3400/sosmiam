import type { StatutAmbassadeur } from "../../types/roles.ts";

/**
 * Vrai si l'espace ambassadeur s'ouvre en entier (missions, relectures, messages) : ambassadeur validé et actif
 * seulement. En attente ou suspendu, le mode ambassadeur ne montre que l'onglet Espace, avec le statut.
 */
export function peutOuvrirEspaceAmbassadeur(statut: StatutAmbassadeur | null): boolean {
  return statut === "actif";
}
