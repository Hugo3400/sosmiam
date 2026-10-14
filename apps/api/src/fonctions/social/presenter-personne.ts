import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

/** Ce que les autres voient d'une personne, en petit : identifiant public, pseudo, prénom, emoji d'avatar (jamais l'id du compte) */
export function presenterPersonne(p: { idPublic: string; pseudo: string; prenom: string; avatar: string | null }): PersonneResume {
  return { id: p.idPublic, pseudo: p.pseudo, prenom: p.prenom, avatar: p.avatar || null };
}
