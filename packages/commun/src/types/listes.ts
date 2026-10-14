// Listes de lieux telles que l'API les rend (décidé le 14 octobre 2026) : l'auteur les remplit et choisit qui les voit
// (« tous » ou sa « bande ») ; il peut inviter des potes de sa bande à les remplir avec lui ; les autres suivent la liste.
import type { PersonneResume } from "./social.ts";

export type VisibiliteListe = "tous" | "bande";

export type ListeResumeApi = {
  id: string;
  titre: string;
  emoji: string;
  description: string;
  auteur: PersonneResume;
  visibilite: VisibiliteListe;
  nombreLieux: number;
  abonnes: number;
  modifieLe: string;
  /** Suspendue ou retirée par la modération : seul l'auteur la voit, avec ce bandeau */
  enModeration?: boolean;
};

export type ListeApi = ListeResumeApi & {
  /** Du plus récent au plus ancien */
  lieux: number[];
  /** Les acceptés pour tous ; les invitations en attente pour l'auteur et l'invité seulement */
  coAuteurs: { personne: PersonneResume; statut: "invite" | "accepte" }[];
  moi: { auteur: boolean; coAuteur: "invite" | "accepte" | null; abonne: boolean; peutRemplir: boolean };
};

export type NouvelleListe = { titre: string; emoji: string; description: string; visibilite: VisibiliteListe };
