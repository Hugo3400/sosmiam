// Contrat des commentaires sous les publications du fil, mêmes routes que l'API (/app/commentaires). La liste d'une
// publication se lit SANS compte (visite comprise) et passe par un cache public de 30 s ; tout le reste demande une session.
// Écrire (commenter, modifier) demande un pseudo (409 pseudo-requis) ; lire « mes commentaires » et aimer, non.

import type { CommentaireApi, MesCommentairesApi } from "../types/commentaires.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Une page de commentaires d'une publication : 100 au plus, les plus récents d'abord (l'app les range avec trierCommentaires) */
export type PageCommentairesApi = { commentaires: CommentaireApi[]; total: number; suite: string | null };

export interface ServiceCommentaires {
  /**
   * GET /app/commentaires/publications/:publicationId[?apres=] : lisible sans compte (session: false). Jamais un commentaire
   * masqué par le lieu, suspendu ou retiré ; un commentaire supprimé qui a encore des réponses vient avec supprime: true et
   * texte "" ; total : les commentaires visibles. apres : la `suite` de la page d'avant
   */
  lister(publicationId: string, apres?: string): Promise<ReponseApi<PageCommentairesApi>>;
  /**
   * GET /app/commentaires/publications/:publicationId/moi : tes J'aime, tes commentaires masqués par le lieu ou suspendus
   * (toi seul les vois, avec leur état), ceux que tu as signalés (à cacher), et si tu peux répondre au nom du lieu
   */
  lireMiens(publicationId: string): Promise<ReponseApi<{ moi: MesCommentairesApi }>>;
  /** reponseA : un commentaire de la même publication ; commeLieu : le gérant du lieu répond au nom du lieu */
  commenter(publicationId: string, c: { texte: string; reponseA?: string; commeLieu?: boolean }): Promise<ReponseApi<{ commentaire: CommentaireApi }>>;
  /** Le tien (ou, pour une réponse du lieu, son gérant) ; « modifié » s'affiche ; seules les nouvelles mentions préviennent */
  modifier(id: string, texte: string): Promise<ReponseApi<{ commentaire: CommentaireApi }>>;
  /** Le tien (ou, pour une réponse du lieu, son gérant) : avec des réponses, il reste « Commentaire supprimé » */
  supprimer(id: string): Promise<ReponseApi>;
  aimer(id: string, oui: boolean): Promise<ReponseApi<{ jaimes: number }>>;
  /**
   * Le gérant du lieu de la publication masque (il part en modération) ou démasque un commentaire ; 409 deja-examine.
   * Aucune route ne relit pour lui ceux qu'il a masqués : pour démasquer, l'app garde leur id
   */
  masquerCommeLieu(id: string, masque: boolean): Promise<ReponseApi>;
}
