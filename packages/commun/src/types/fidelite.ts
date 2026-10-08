// Cartes de fidélité : le programme réglé par le lieu, ce qu'en voit le client, et les récompenses gagnées.

import type { LieuResume } from "./lieu-resume.ts";

export type ReglageFidelite = {
  actif: boolean;
  visitesRequises: number;
  recompense: string;
  alcool: boolean;
  recompenseSansAlcool: string | null;
};

export type ProgrammeFidelite = ReglageFidelite & { lieuId: number; modifieLe: string };

/** Ce que voit le client : la récompense déjà choisie selon son âge */
export type ProgrammeFidelitePublic = { visitesRequises: number; recompense: string };

/** Récompense gagnée, figée au moment où la carte s'est remplie */
export type RecompensePrete = { id: number; libelle: string; gagneeLe: string };

export type DemandeRecompense = { id: number; recompenseId: number; code: string; creeLe: string; expireLe: string };

export type CarteFidelite = {
  lieu: LieuResume;
  programmeActif: boolean;
  tampons: number;
  sur: number;
  recompense: string;
  pretes: RecompensePrete[];
  demande: DemandeRecompense | null;
};

export type EtatCarteFidelite = { tampons: number; pretes: RecompensePrete[] };
