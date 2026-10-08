// Avis vérifiés : ouverts seulement après une visite validée, signés « Prénom I. », datés au mois.
// La relecture par un ambassadeur est consultative et ne montre jamais l'auteur ni son âge.

import type { LieuResume } from "./lieu-resume.ts";
import type { ModeValidation } from "./visite.ts";

export type NoteAvis = 1 | 2 | 3 | 4 | 5;

export type NouvelAvis = { visiteId: number; note: NoteAvis; texte: string; photo: string | null };

export type StatutAvis = "publie" | "en-relecture" | "masque";

/** Signature « Léa M. » (« Léa » pour un 15-17 ans) ; mois « AAAA-MM » : jamais le jour ni l'heure */
export type AvisPublic = {
  id: number;
  note: NoteAvis;
  texte: string;
  photo: string | null;
  signature: string;
  preuve: ModeValidation;
  mois: string;
  reponseLieu: { texte: string; mois: string } | null;
};

/** partRetour : de 0 à 1, null en dessous de 20 clients */
export type ResumeAvis = { moyenne: number | null; nombre: number; partRetour: number | null };

export type RaisonRelecture = "rafale-notes" | "compte-neuf" | "mots-filtres" | "lieu-sous-alerte" | "tirage";

export type MotifAvisLouche = "hors-sujet" | "attaque" | "faux-avis" | "infos-perso" | "autre";

export type VerdictRelecture = { type: "ok" } | { type: "louche"; motif: MotifAvisLouche } | { type: "deporte" };

/** Jamais l'auteur ni son âge */
export type AvisARelire = {
  id: number;
  lieu: LieuResume;
  note: NoteAvis;
  texte: string;
  photo: string | null;
  preuve: ModeValidation;
  mois: string;
  raison: RaisonRelecture;
};
