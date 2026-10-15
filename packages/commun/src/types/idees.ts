import type { PersonneResume } from "./social.ts";

export type StatutIdee = "en-relecture" | "proposee" | "a-l-etude" | "prevue" | "faite";

export type ReponseBrigade = { texte: string; date: string };

export type IdeeMiamis = {
  id: string;
  titre: string;
  detail: string;
  auteur: PersonneResume | null;
  date: string;
  statut: StatutIdee;
  votes: number;
  aVote: boolean;
  votants: PersonneResume[];
  commentaires: number;
  reponseBrigade: ReponseBrigade | null;
  ideeDuMois: string | null;
};

export type CommentaireIdee = {
  id: string;
  ideeId: string;
  auteur: PersonneResume;
  texte: string;
  date: string;
  jaime: number;
  aime: boolean;
  reponseA: string | null;
};

export type NouvelleIdee = { titre: string; detail: string };
