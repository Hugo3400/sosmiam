import type { RubriqueActus } from "../regles/actus.ts";
import type { ArticleActus, ArticleCitantLieuActus, BrouillonRetoucheActus, CommentaireActus, CorpsArticleActus, MonArticleActus } from "../types/actus.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type FiltresListeActus = { rubrique: RubriqueActus | null; ville: string | null; curseur: string | null };

export interface ServiceActus {
  lister(filtres: FiltresListeActus): Promise<ReponseApi<{ articles: ArticleActus[]; suivant: string | null }>>;
  abonnements(): Promise<ReponseApi<{ articles: ArticleActus[] }>>;
  villes(): Promise<ReponseApi<{ villes: { ville: string; articles: number }[] }>>;
  lire(id: number): Promise<ReponseApi<{ article: ArticleActus }>>;
  aimer(id: number, aime: boolean): Promise<ReponseApi<{ jaime: number; aime: boolean }>>;
  envoyerPhoto(octets: Blob | ArrayBuffer | Uint8Array): Promise<ReponseApi<{ photo: string }>>;
  envoyer(corps: CorpsArticleActus): Promise<ReponseApi<{ id: number }>>;
  mesArticles(): Promise<ReponseApi<{ articles: MonArticleActus[]; envoyesCetteSemaine: number }>>;
  lireBrouillon(id: number): Promise<ReponseApi<{ brouillon: BrouillonRetoucheActus }>>;
  retoucher(id: number, corps: CorpsArticleActus): Promise<ReponseApi>;
  articlesDuLieu(lieuId: number): Promise<ReponseApi<{ articles: ArticleCitantLieuActus[] }>>;
  repondre(lieuId: number, articleId: number, texte: string): Promise<ReponseApi>;
  commentaires(articleId: number, apres: number | null): Promise<ReponseApi<{ commentaires: CommentaireActus[]; suite: number | null }>>;
  commenter(articleId: number, texte: string, reponseA: number | null): Promise<ReponseApi<{ commentaire: CommentaireActus }>>;
  supprimerCommentaire(commentaireId: number): Promise<ReponseApi>;
}
