import type { MotifModeration } from "../contenus/motifs-moderation.ts";
import type { RubriqueActus } from "../regles/actus.ts";
import type { TypeLieu } from "./lieu.ts";

export type StatutArticleActus = "en-relecture" | "a-retoucher" | "publie" | "refuse" | "retire";

export type LieuCiteActus = { id: number; nom: string; type: TypeLieu; emoji: string; quartier: string; ville: string; verifie: boolean };

export type AuteurActus = { id: number; prenom: string; avatar: string | null; ambassadeur: boolean };

export type ReponseLieuActus = { lieuId: number; nomLieu: string; texte: string; repondueLe: string };

export type CommentaireActus = { id: number; auteur: AuteurActus; texte: string; ecritLe: string };

export type ArticleActus<Image = string> = {
  id: number;
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  paragraphes: string[];
  citation: string | null;
  couverture: Image;
  photos: Image[];
  lieux: LieuCiteActus[];
  auteur: AuteurActus;
  collaboration: boolean;
  alcool: boolean;
  finLe: string | null;
  publieLe: string;
  aLaUne: boolean;
  jaime: number;
  commentaires: number;
  reponsesLieux: ReponseLieuActus[];
  aime?: boolean;
};

export type ChampArticleActus = "couverture" | "titre" | "accroche" | "texte" | "citation" | "photos" | "lieux" | "fin" | "collaboration";

export type BrouillonArticleActus = {
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  texte: string;
  citation: string;
  couverture: boolean;
  photos: number;
  lieux: readonly number[];
  collaboration: boolean | null;
  finLe: string | null;
};

export type ArticleEnvoyeActus = {
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  paragraphes: string[];
  citation: string | null;
  photos: number;
  lieux: number[];
  collaboration: boolean;
  finLe: string | null;
};

export type MonArticleActus<Image = string> = {
  id: number;
  rubrique: RubriqueActus;
  titre: string;
  couverture: Image;
  statut: StatutArticleActus;
  envoyeLe: string;
  publieLe: string | null;
  retouche: { message: string; le: string } | null;
  refus: { motif: MotifModeration; motivation: string; le: string } | null;
  jaime: number;
  commentaires: number;
  lieuARepondu: boolean;
};

export type StatutReponseLieuActus = "en-relecture" | "publie" | "refuse" | "retire";

export type ArticleCitantLieuActus<Image = string> = {
  id: number;
  titre: string;
  couverture: Image;
  auteur: string;
  publieLe: string;
  reponse: { texte: string; statut: StatutReponseLieuActus; motif: MotifModeration | null; peutReecrire: boolean } | null;
};

export type TypeClocheActus = "actu-publiee" | "actu-a-retoucher" | "actu-refusee" | "actu-lieu-cite" | "actu-reponse-publiee" | "actu-reponse-refusee";

export type ArticleARelire = {
  id: number;
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  paragraphes: string[];
  citation: string | null;
  couverture: string;
  photos: string[];
  lieux: LieuCiteActus[];
  auteur: { id: number; prenom: string; ambassadeur: boolean; ville: string };
  collaboration: boolean;
  alcool: boolean;
  finLe: string | null;
  envoyeLe: string;
  statut: StatutArticleActus;
  retouche: { message: string; le: string } | null;
  renvoye: boolean;
  publieLe: string | null;
  refus: { motif: MotifModeration; motivation: string; le: string; contestation: string | null } | null;
};

export type ReponseLieuARelire = {
  id: number;
  articleId: number;
  titreArticle: string;
  auteurArticle: string;
  lieu: { id: number; nom: string; emoji: string };
  texte: string;
  envoyeLe: string;
  statut: StatutReponseLieuActus;
};

export type ActusARelire = { articles: ArticleARelire[]; reponses: ReponseLieuARelire[] };

export type CorpsArticleActus = {
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  texte: string;
  citation: string;
  couverture: string;
  photos: string[];
  lieux: number[];
  collaboration: boolean | null;
  finLe: string | null;
};

export type BrouillonRetoucheActus = CorpsArticleActus & { adresses: { couverture: string; photos: string[] }; retouche: string | null };
