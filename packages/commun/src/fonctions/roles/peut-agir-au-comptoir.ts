import type { RolesCompte } from "../../types/roles.ts";

/**
 * Vrai si le compte fait partie de l'équipe de ce lieu (gérant ou équipe) : valider une addition, montrer le QR,
 * répondre aux réservations, offrir une récompense. Le serveur relit toujours le lieu sur la ressource.
 */
export function peutAgirAuComptoir(roles: RolesCompte, lieuId: number): boolean {
  return roles.pro.some((lieu) => lieu.id === lieuId && (lieu.role === "gerant" || lieu.role === "equipe"));
}
