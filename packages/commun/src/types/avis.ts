// Avis vérifiés : ouverts seulement après une visite validée, signés « Prénom I. », datés au mois. Avis non vérifiés :
// seulement chez un lieu sans compte SOS Miam. La relecture par un ambassadeur est consultative et ne montre jamais
// l'auteur ni son âge.

import type { LieuResume } from "./lieu-resume.ts";
import type { ModeValidation } from "./visite.ts";

export type NoteAvis = 1 | 2 | 3 | 4 | 5;

export type NouvelAvis = { visiteId: number; note: NoteAvis; texte: string; photo: string | null };

/** Avis « non vérifié » : seulement chez un lieu non vérifié (sans compte SOS Miam), sans visite ni points, un par compte et
 * par lieu tous les 30 jours */
export type NouvelAvisNonVerifie = { lieuId: number; note: NoteAvis; texte: string; photo: string | null };

export type StatutAvis = "publie" | "en-relecture" | "masque";

/** La réponse publique du lieu : publiée tout de suite, relue après par l'équipe SOS Miam */
export type StatutReponseAvis = "publiee" | "en-relecture" | "masquee";

/**
 * Signature « Léa M. » (« Léa » pour un 15-17 ans) ; mois « AAAA-MM » (heure de Paris) : jamais le jour ni l'heure.
 * preuve : comment la visite a été validée, null pour un avis non vérifié (verifie: false). repasOffert : la visite était
 * offerte par le lieu (« Repas offert ») ; avecReduction : payée avec une réduction (« Avec réduction »).
 */
export type AvisPublic = {
  id: number;
  note: NoteAvis;
  texte: string;
  photo: string | null;
  signature: string;
  preuve: ModeValidation | null;
  mois: string;
  reponseLieu: { texte: string; mois: string } | null;
  verifie: boolean;
  repasOffert: boolean;
  avecReduction: boolean;
};

/** Une page d'avis d'un lieu : suite, le curseur de la page suivante (?apres=), null à la dernière */
export type PageAvisLieu = { resume: ResumeAvis; avis: AvisPublic[]; suite: string | null };

/** moyenne : moyenne prudente arrondie au dixième ; partRetour : de 0 à 1 (au centième), null en dessous de 20 clients */
export type ResumeAvis = { moyenne: number | null; nombre: number; partRetour: number | null };

export type RaisonRelecture = "rafale-notes" | "compte-neuf" | "mots-filtres" | "lieu-sous-alerte" | "tirage";

export type MotifAvisLouche = "hors-sujet" | "attaque" | "faux-avis" | "infos-perso" | "autre";

export type VerdictRelecture = { type: "ok" } | { type: "louche"; motif: MotifAvisLouche } | { type: "deporte" };

/** Jamais l'auteur ni son âge ; preuve null : avis non vérifié */
export type AvisARelire = {
  id: number;
  lieu: LieuResume;
  note: NoteAvis;
  texte: string;
  photo: string | null;
  preuve: ModeValidation | null;
  mois: string;
  raison: RaisonRelecture;
};
