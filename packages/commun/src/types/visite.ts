// Une visite validée (ou en passe de l'être) : addition demandée, QR du comptoir ou réservation honorée.
// Les transitions et leurs effets sont calculés par faireEvoluerVisite (fonctions/visites/), côté serveur seulement.

import type { CarteFidelite, ProgrammeFidelitePublic } from "./fidelite.ts";
import type { LieuResume } from "./lieu-resume.ts";
import type { ResultatPosition } from "./position.ts";

/** Les trois façons de valider une visite (« ticket » plus tard) */
export type ModeValidation = "addition" | "comptoir" | "reservation";

export type StatutVisite = "demandee" | "validee" | "refusee" | "annulee" | "expiree" | "retiree";

/** Motifs fermés : jamais de texte libre du lieu vers le client */
export type MotifRefusVisite = "introuvable" | "pas-venu" | "doublon" | "autre";

/**
 * Comment la visite a été réglée, choisi par l'équipe en validant (décidé le 9 octobre 2026) : payée (+15 ou +25, tampon,
 * avis), payée avec une réduction (pareil, la réduction est indiquée) ou offerte par le lieu (visite notée, ni points ni
 * tampon, avis marqué « Repas offert »).
 */
export type TypeReglement = "paye" | "reduction" | "offert";

/** Avantages indiqués par l'équipe : liste fermée, jamais de texte libre du lieu vers le client */
export type AvantageVisite = "recompense-fidelite" | "happy-hour" | "offre-sos" | "partenariat" | "autre";

export type ReglementVisite = {
  type: TypeReglement;
  /** Seulement pour une réduction : un des pourcentages de REDUCTIONS_POURCENT, ou null si l'équipe ne le précise pas */
  reductionPourcent: number | null;
  avantages: AvantageVisite[];
};

export type Visite = {
  id: number;
  lieu: LieuResume;
  mode: ModeValidation;
  statut: StatutVisite;
  /** Code de rapprochement à 4 chiffres (addition en attente), sinon null */
  code: string | null;
  creeLe: string;
  expireLe: string | null;
  valideLe: string | null;
  decideLe: string | null;
  /** Décidé à la demande ou au scan : un SOS était en cours */
  pendantSos: boolean;
  /** Points crédités (0 si pas validée ou retirée) */
  points: number;
  tampon: boolean;
  resultatPosition: ResultatPosition | null;
  motifRefus: MotifRefusVisite | null;
  contestee: boolean;
  avis: { ouvertLe: string; fermeLe: string; donne: boolean } | null;
  annulableJusqua: string | null;
  /** Comment elle a été réglée ; null tant qu'elle n'est pas validée (une visite validée sans règlement connu se lit « payée ») */
  reglement: ReglementVisite | null;
  /** Visite de démo : reste sur le téléphone, jamais importée dans un vrai compte */
  demo: boolean;
};

export type EvenementVisite =
  | { type: "regler" }
  | { type: "refuser"; motif: MotifRefusVisite }
  | { type: "annuler-client" }
  | { type: "expirer" }
  | { type: "annuler-lieu"; motif: MotifRefusVisite }
  | { type: "retirer" };

export type EffetVisite =
  | { type: "points"; valeur: number; raison: "visite" | "visite-sos" | "annulation-visite" }
  | { type: "tampon"; delta: 1 | -1 }
  | { type: "ouvrir-avis"; ouvertLe: string; fermeLe: string }
  | { type: "masquer-avis" }
  | { type: "controle"; motif: "refus-lieu" | "annulation-lieu" };

export type EtatVisitePourTransition = Pick<Visite, "statut" | "expireLe" | "valideLe" | "pendantSos" | "points" | "tampon">;

export type TransitionVisite =
  | {
      ok: true;
      statut: StatutVisite;
      valideLe: string | null;
      decideLe: string;
      points: number;
      annulableJusqua: string | null;
      effets: EffetVisite[];
    }
  | { ok: false; erreur: "transition-interdite" | "delai-depasse" };

export type InfosVisiteLieu = {
  lieuId: number;
  validationActive: boolean;
  reservable: boolean;
  programme: ProgrammeFidelitePublic | null;
  carte: CarteFidelite | null;
  /** Ta demande d'addition en attente, si elle est chez ce lieu */
  enCoursIci: Visite | null;
};

export type ResultatValidation = { visite: Visite; carte: CarteFidelite | null; recompenseGagnee: boolean; dejaValidee: boolean };
