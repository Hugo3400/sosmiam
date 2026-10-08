import type { RolesCompte } from "../../types/roles.ts";

/** Vrai si le compte gère ce lieu (rôle « gérant ») : carte de fidélité, réponses publiques aux avis, réglages. */
export function peutReglerLieu(roles: RolesCompte, lieuId: number): boolean {
  return roles.pro.some((lieu) => lieu.id === lieuId && lieu.role === "gerant");
}
