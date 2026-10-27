import type { RubriqueActus } from "../regles/actus.ts";

export type StatutArticleActus = "en-relecture" | "a-retoucher" | "publie" | "refuse";

export type LieuCiteActus = { id: number; nom: string; emoji: string; quartier: string; ville: string; verifie: boolean };

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
