// L'écran du comptoir, côté équipe du lieu : additions et récompenses à valider, QR montré, arrivées, validations récentes.

import type { LieuResume } from "./lieu-resume.ts";
import type { ReservationPro } from "./reservation.ts";
import type { ModeValidation, ReglementVisite } from "./visite.ts";

/** Ce que voit l'équipe : jamais l'âge, le nom complet ni l'historique ailleurs */
export type DemandeComptoir = {
  id: number;
  type: "addition" | "recompense";
  code: string;
  prenom: string;
  initialeNom: string | null;
  avatar: string;
  depuis: string;
  recompense: string | null;
  tamponsIci: number;
};

export type QrAffiche = {
  texte: string;
  presentationId: number;
  fenetre: number;
  changeDansMs: number;
  personnes: number;
  restantes: number;
  finitLe: string;
  /** Comment la table a réglé (choisi en montrant le QR) ; null : payée */
  reglement: ReglementVisite | null;
};

export type ValidationRecente = {
  visiteId: number;
  mode: ModeValidation;
  prenom: string;
  initialeNom: string | null;
  avatar: string;
  valideLe: string;
  annulableJusqua: string;
  /** Payée, avec réduction ou offerte, et les avantages indiqués ; null si inconnu (lu « payée ») */
  reglement: ReglementVisite | null;
};

export type EtatComptoir = {
  lieu: LieuResume;
  validationActive: boolean;
  /** Le code du QR de vitrine (kit) : il ouvre la fiche du lieu, il ne valide jamais une visite */
  codePublic: string;
  qr: QrAffiche | null;
  demandes: DemandeComptoir[];
  /** Réservations acceptées du jour (arrivées) */
  arrivees: ReservationPro[];
  reservationsARepondre: number;
  validees: ValidationRecente[];
  genereLe: string;
};
