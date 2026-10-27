import type { MotifModeration } from "../contenus/motifs-moderation.ts";
import type { RubriqueActus } from "../regles/actus.ts";
import type { TypeLieu } from "./lieu.ts";

export type StatutArticleActus = "en-relecture" | "a-retoucher" | "publie" | "refuse";

export type LieuCiteActus = { id: number; nom: string; type: TypeLieu; emoji: string; quartier: string; ville: string; verifie: boolean };

export type AuteurActus = { id: number; prenom: string; avatar: string | null; ambassadeur: boolean };

export type ReponseLieuActus = { nomLieu: string; texte: string; repondueLe: string };

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
  reponseLieu: ReponseLieuActus | null;
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

export type StatutReponseLieuActus = "en-relecture" | "publie" | "refuse";

export type ArticleCitantLieuActus<Image = string> = {
  id: number;
  titre: string;
  couverture: Image;
  auteur: string;
  publieLe: string;
  reponse: { texte: string; statut: StatutReponseLieuActus; motif: MotifModeration | null; peutReecrire: boolean } | null;
};
