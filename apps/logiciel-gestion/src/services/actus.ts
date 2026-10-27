import type { RubriqueActus } from "../../../../packages/commun/src/regles/actus.ts";
import type { LieuCiteActus, StatutArticleActus } from "../../../../packages/commun/src/types/actus.ts";
import { ARTICLES_ACTUS_EXEMPLE, REPONSES_ACTUS_EXEMPLE } from "~/contenus/actus-exemples.ts";

export type ArticleARelire = {
  id: number;
  rubrique: RubriqueActus;
  titre: string;
  accroche: string;
  paragraphes: string[];
  citation: string | null;
  couverture: string | null;
  photos: number;
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
  refus: { motif: string; motivation: string; le: string; contestation: string | null } | null;
};

export type ReponseLieuARelire = {
  id: number;
  articleId: number;
  titreArticle: string;
  auteurArticle: string;
  lieu: { id: number; nom: string; emoji: string };
  texte: string;
  envoyeLe: string;
  statut: "en-relecture" | "publie" | "refuse";
};

export type FileActus = { exemple: boolean; articles: ArticleARelire[]; reponses: ReponseLieuARelire[] };

export async function lireFileActus(): Promise<FileActus> {
  return { exemple: true, articles: structuredClone(ARTICLES_ACTUS_EXEMPLE), reponses: structuredClone(REPONSES_ACTUS_EXEMPLE) };
}
