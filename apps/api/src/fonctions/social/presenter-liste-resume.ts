import type { ListeResumeApi } from "../../../../../packages/commun/src/types/listes.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

/** Une ligne de listes_lieux, avec ses deux compteurs (lieux publiés, abonnés) */
export type LigneListeResume = {
  id: number;
  titre: string;
  emoji: string;
  description: string;
  visibilite: string;
  modifieLe: Date;
  suspendueLe: Date | null;
  retireeLe: Date | null;
  nombreLieux: number;
  abonnes: number;
};

/**
 * Une liste en petit (profils, « À découvrir », mes listes) ; le détail (ListeApi) est construit à partir d'ici
 * (presenter-liste-detail.ts). enModeration : suspendue ou retirée par la modération, ce que seul son auteur voit encore
 * (le service ne la montre pas aux autres).
 */
export function presenterListeResume(liste: LigneListeResume, auteur: PersonneResume): ListeResumeApi {
  const resume: ListeResumeApi = {
    id: String(liste.id),
    titre: liste.titre,
    emoji: liste.emoji,
    description: liste.description,
    auteur,
    visibilite: liste.visibilite === "bande" ? "bande" : "tous",
    nombreLieux: liste.nombreLieux,
    abonnes: liste.abonnes,
    modifieLe: liste.modifieLe.toISOString(),
  };
  if (liste.suspendueLe || liste.retireeLe) resume.enModeration = true;
  return resume;
}
