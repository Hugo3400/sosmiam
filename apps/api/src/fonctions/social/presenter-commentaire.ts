import type { CommentaireApi } from "../../../../../packages/commun/src/types/commentaires.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import { lireMentionsCommentaire } from "./lire-mentions-commentaire.ts";

/** Ce que les services lisent d'un commentaire (colonnes de commentaires_publications, et son nombre de J'aime) */
export type LigneCommentaire = {
  id: number;
  publicationId: number;
  auteurId: number | null;
  commeLieuId: number | null;
  texte: string;
  mentions: unknown;
  reponseAId: number | null;
  creeLe: Date;
  modifieLe: Date | null;
  supprimeLe: Date | null;
  masqueParLieuLe: Date | null;
  suspenduLe: Date | null;
  jaimes: number;
};

/**
 * Un commentaire au format de l'app (CommentaireApi). La réponse du lieu est signée « le lieu » (jamais le gérant qui l'a
 * écrite) ; un commentaire supprimé qui a encore des réponses rend texte "" et supprime: true (« Commentaire supprimé »).
 * `auteur` : la personne qui l'a écrit (relations.presenter) ; null pour une personne sans profil présentable, et alors
 * rien n'est rendu. `avecEtat` : seulement pour son auteur (MesCommentairesApi.miens), « masque-par-le-lieu » ou « suspendu ».
 */
export function presenterCommentaire(c: LigneCommentaire, auteur: PersonneResume | null, o: { avecEtat?: boolean } = {}): CommentaireApi | null {
  if (c.commeLieuId === null && !auteur) return null;
  const supprime = c.supprimeLe !== null;
  const etat = !o.avecEtat ? undefined : c.masqueParLieuLe ? "masque-par-le-lieu" : c.suspenduLe ? "suspendu" : undefined;
  return {
    id: String(c.id),
    publicationId: String(c.publicationId),
    auteur: c.commeLieuId !== null ? { type: "lieu" } : { type: "personne", personne: auteur! },
    texte: supprime ? "" : c.texte,
    date: c.creeLe.toISOString(),
    modifieLe: c.modifieLe?.toISOString() ?? null,
    supprime,
    jaimes: c.jaimes,
    reponseA: c.reponseAId === null ? null : String(c.reponseAId),
    mentions: supprime ? [] : lireMentionsCommentaire(c.mentions),
    ...(etat ? { etat } : {}),
  };
}
