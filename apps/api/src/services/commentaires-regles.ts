// Les commentaires sous les publications du fil (décidé le 8 octobre 2026 ; spécification sociale B.7, D.2), contrat commun
// du service Prisma (commentaires.ts) et de son double en mémoire (commentaires-en-memoire.ts). Contenu PUBLIC, lisible sans
// compte : pas chiffré. Réponses sur un seul niveau, J'aime, mentions « @pseudo » gardées avec l'identifiant public de la
// personne citée (jamais son pseudo seul : un pseudo repris plus tard n'hérite pas des anciennes mentions), réponse du lieu
// par son gérant (signée « le lieu », jamais le gérant), masquage par le lieu qui part en modération. Aucune règle d'âge :
// l'app est réservée aux majeurs.
//
// Qui voit quoi :
// - tout le monde (même sans compte) : les commentaires d'une publication visible, ni masqués par le lieu, ni suspendus
//   (« choquant » en attendant la modération), ni retirés ; un commentaire supprimé qui a encore des réponses reste en
//   « Commentaire supprimé » (texte vide) ;
// - son auteur, en plus : les siens masqués par le lieu ou suspendus (MesCommentairesApi.miens).
// Le gérant ne relit PAS ceux qu'il a masqués : aucune route ne les lui rend (il les démasque par leur id, tant que l'app
// s'en souvient ; une liste pour lui serait un ajout de forme commune, à décider).
// Les commentaires de quelqu'un qui t'a bloqué restent lisibles (ils le sont sans compte) ; tu ne peux ni y répondre (ni à
// une réponse sous l'un d'eux), ni les aimer, ni le citer (404 commentaire-inconnu, mention laissée en texte simple).
// Bloquer coupe dans les deux sens. Sous une publication qui ne se voit plus : 404 pour tout le monde, sauf supprimer le sien.
import { extraireMentions } from "../../../../packages/commun/src/fonctions/commentaires/extraire-mentions.ts";
import type { CommentaireApi, MesCommentairesApi } from "../../../../packages/commun/src/types/commentaires.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { MAX_MENTIONS, type ServicesSocial } from "./social-regles.ts";

export type RefusCommentaire = "publication-inconnue" | "commentaire-inconnu" | "reserve-a-l-auteur" | "reserve-au-gerant" | "deja-examine";
export type ResultatCommentaire = { ok: true; commentaire: CommentaireApi; effets: EffetSocial[] } | { ok: false; erreur: RefusCommentaire };
export type PageCommentaires = { commentaires: CommentaireApi[]; total: number; suite: string | null };
export type NouveauCommentaire = { texte: string; reponseA: number | null; commeLieu: boolean };

export interface ServicesCommentaires {
  /** Lecture publique : 100 par page, les plus récents d'abord ; null : publication inconnue ou pas visible */
  listerPublics(publicationId: number, apres: string | null, maintenant: Date): Promise<PageCommentaires | null>;
  /** Tes J'aime, tes commentaires masqués par le lieu ou suspendus, ceux que tu as signalés, et si tu es gérant du lieu */
  lireMiens(compteId: number, publicationId: number, maintenant: Date): Promise<MesCommentairesApi | null>;
  /**
   * reponseA : un commentaire visible de la même publication (une réponse à une réponse va sous son commentaire, qui doit
   * se voir lui aussi, ou être « Commentaire supprimé »), sans blocage avec l'auteur de l'un ou de l'autre ; commeLieu : seulement le gérant du lieu de la publication (403 reserve-au-gerant, APRÈS les
   * 404) ; mentions retrouvées par social.trouverMentions ; effets : « mention » (si la personne citée suit l'auteur ou l'a
   * dans sa bande) et « reponse-commentaire » (pour l'auteur du commentaire auquel on répond)
   */
  commenter(compteId: number, publicationId: number, c: NouveauCommentaire, maintenant: Date): Promise<ResultatCommentaire>;
  /**
   * Le tien (ou, pour une réponse du lieu, le gérant du lieu), sous une publication visible : modifieLe, mentions
   * recalculées, seules les nouvelles préviennent
   */
  modifier(compteId: number, commentaireId: number, texte: string, maintenant: Date): Promise<ResultatCommentaire>;
  /**
   * Le tien (ou une réponse du lieu, par son gérant), même sous une publication qui ne se voit plus. Sans réponse ni
   * signalement ouvert : effacé ; sinon « Commentaire supprimé »
   */
  supprimer(compteId: number, commentaireId: number, maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: RefusCommentaire }>;
  /** J'aime (sans prévenir personne) ; jaimes : le nombre après le geste */
  basculerJaime(compteId: number, commentaireId: number, oui: boolean, maintenant: Date): Promise<{ ok: true; jaimes: number } | { ok: false; erreur: RefusCommentaire }>;
  /**
   * Le gérant du lieu de la publication masque (ou démasque) un commentaire d'une personne. Masqué : masqueParLieuLe +
   * Signalement { source « lieu », raison « autre », explication « Masqué par le lieu », instantané chiffré, auteurContenuId }
   * dans la même transaction (un seul ouvert par commentaire : masquer de nouveau le réutilise) + « contenu-masque » pour son
   * auteur. 409 deja-examine si un masquage par le lieu de ce commentaire a déjà été rejeté par la modération (même modifié depuis). 🔐 (instantané)
   */
  masquerParLieu(compteId: number, commentaireId: number, masque: boolean, maintenant: Date): Promise<{ ok: true; effets: EffetSocial[] } | { ok: false; erreur: RefusCommentaire }>;
}

/** Commentaires par page de la lecture publique */
export const COMMENTAIRES_PAR_PAGE = 100;
/** Ce qu'écrit un masquage par le lieu dans son signalement (lu par la modération) */
export const EXPLICATION_MASQUE_PAR_LIEU = "Masqué par le lieu";
/** detail de « contenu-masque » : masqué par le gérant du lieu (sinon « choquant ») */
export const DETAIL_MASQUE_PAR_LIEU = "masque-par-le-lieu";
/** detail de « reponse-commentaire » quand c'est le lieu qui répond (acteur null : jamais le gérant qui l'a écrite) */
export const DETAIL_REPONSE_DU_LIEU = "lieu";

/**
 * Visible de tout le monde (et compté dans PublicationApi.commentaires) : ni supprimé, ni masqué par le lieu, ni suspendu,
 * ni retiré. Même forme qu'un filtre Prisma de commentaires_publications.
 */
export const COMMENTAIRE_VISIBLE_PUBLIC = { supprimeLe: null, masqueParLieuLe: null, suspenduLe: null, retireLe: null } as const;

/** Les états d'un commentaire qui décident de qui le voit */
type EtatCommentaire = { auteurId: number | null; supprimeLe: Date | null; masqueParLieuLe: Date | null; suspenduLe: Date | null; retireLe: Date | null };

/** Vrai si `moi` voit ce commentaire (null : sans compte) : public, ou le sien masqué ou suspendu ; jamais supprimé ni retiré */
export function voitCommentaire(c: EtatCommentaire, moi: number | null): boolean {
  if (c.supprimeLe !== null || c.retireLe !== null) return false;
  if (c.masqueParLieuLe === null && c.suspenduLe === null) return true;
  return moi !== null && c.auteurId === moi;
}

/**
 * Les mentions d'un texte, à garder dans la colonne `mentions` : [{ p: pseudo tel qu'écrit (en minuscules), id :
 * identifiant public }], 10 au plus. Un pseudo inconnu, sans profil social, « pas trouvable » (hors bande et suivis) ou avec
 * un blocage dans un sens ou dans l'autre reste du texte simple.
 */
export async function retrouverMentions(social: Pick<ServicesSocial, "trouverMentions">, compteId: number, texte: string): Promise<{ p: string; id: string }[]> {
  const pseudos = extraireMentions(texte).slice(0, MAX_MENTIONS);
  if (pseudos.length === 0) return [];
  const trouves = await social.trouverMentions(compteId, pseudos);
  return pseudos.flatMap((p) => {
    const id = trouves.get(p);
    return id ? [{ p, id }] : [];
  });
}

/**
 * Les effets d'un commentaire écrit ou modifié, pour la cloche (rien sur le téléphone) ; cible : la publication, que l'app
 * ouvre avec ses commentaires.
 * - « reponse-commentaire » pour l'auteur du commentaire auquel on répond (pas pour soi-même) ; une réponse du lieu part
 *   sans acteur, avec detail « lieu » (jamais le gérant qui l'a écrite) ;
 * - « mention » pour chaque NOUVELLE personne citée qui suit l'auteur (suivi accepté) ou l'a dans sa bande ; pas pour celle
 *   qui reçoit déjà la réponse, ni pour une réponse du lieu (on ne suit pas un lieu de cette façon).
 */
export async function ecrireEffetsCommentaire(
  relations: Pick<RelationsSociales, "trouverComptes" | "lireLiens">,
  o: { auteurId: number; commeLieu: boolean; publicationId: number; nouvellesMentions: readonly string[]; parentAuteurId: number | null },
): Promise<EffetSocial[]> {
  const cible = { type: "publication" as const, id: String(o.publicationId) };
  const effets: EffetSocial[] = [];
  if (o.parentAuteurId !== null && o.parentAuteurId !== o.auteurId) {
    effets.push({
      quoi: "cloche",
      notification: { compteId: o.parentAuteurId, type: "reponse-commentaire", acteurId: o.commeLieu ? null : o.auteurId, cible, ...(o.commeLieu ? { detail: DETAIL_REPONSE_DU_LIEU } : {}) },
    });
  }
  if (o.commeLieu || o.nouvellesMentions.length === 0) return effets;
  const comptes = [...(await relations.trouverComptes(o.nouvellesMentions, o.auteurId)).values()].filter((id) => id !== o.auteurId && id !== o.parentAuteurId);
  if (comptes.length === 0) return effets;
  const liens = await relations.lireLiens(o.auteurId, comptes);
  for (const compteId of comptes) {
    const lien = liens.get(compteId);
    if (lien && (lien.meSuit || lien.pote) && !lien.bloqueParMoi && !lien.mABloque) {
      effets.push({ quoi: "cloche", notification: { compteId, type: "mention", acteurId: o.auteurId, cible } });
    }
  }
  return effets;
}
