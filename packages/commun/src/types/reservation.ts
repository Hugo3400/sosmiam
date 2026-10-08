// Réservations dans l'app : la demande du client, ce qu'en voit le lieu, et les transitions (faireEvoluerReservation).

import type { LieuResume } from "./lieu-resume.ts";

export type StatutReservation = "demandee" | "acceptee" | "refusee" | "annulee" | "expiree" | "honoree" | "absent";

/** Motifs fermés : jamais de texte libre du lieu vers le client */
export type MotifRefusReservation = "complet" | "ferme" | "groupe-trop-grand" | "autre";

/** jour « AAAA-MM-JJ » et heure « HH:MM », à l'heure du lieu (Paris) */
export type DemandeReservation = { lieuId: number; personnes: number; jour: string; heure: string; message: string | null };

export type Reservation = {
  id: number;
  lieu: LieuResume;
  personnes: number;
  creneau: string;
  message: string | null;
  statut: StatutReservation;
  motifRefus: MotifRefusReservation | null;
  tardive: boolean;
  creeLe: string;
  reponduLe: string | null;
  /** « Je suis là » confirmé, position vérifiée */
  presenceLe: string | null;
  /** Code de rapprochement montré à l'arrivée */
  code: string | null;
  visiteId: number | null;
  demo: boolean;
};

/** Ce que voit l'équipe du lieu : prénom, initiale et avatar, jamais l'âge */
export type ReservationPro = {
  id: number;
  prenom: string;
  initialeNom: string | null;
  avatar: string;
  personnes: number;
  creneau: string;
  message: string | null;
  statut: StatutReservation;
  presence: boolean;
  code: string | null;
  creeLe: string;
};

export type EvenementReservation =
  | { type: "accepter" }
  | { type: "refuser"; motif: MotifRefusReservation }
  | { type: "annuler-client" }
  | { type: "annuler-lieu"; motif: MotifRefusReservation }
  | { type: "expirer" }
  | { type: "venu" }
  | { type: "absent" }
  | { type: "presence" };

export type EffetReservation = { type: "creer-visite" } | { type: "controle"; motif: "absence-reservation" | "annulation-tardive" };

export type EtatReservationPourTransition = Pick<Reservation, "statut" | "creneau" | "presenceLe">;

export type TransitionReservation =
  | { ok: true; statut: StatutReservation; presenceLe: string | null; tardive: boolean; effets: EffetReservation[] }
  | { ok: false; erreur: "transition-interdite" | "delai-depasse" | "hors-fenetre-presence" };
