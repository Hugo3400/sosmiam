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
/** recompenseAlcool : la récompense montrée est la version avec alcool (le message sanitaire s'affiche à côté) */
export type ProgrammeFidelitePublic = { visitesRequises: number; recompense: string; recompenseAlcool: boolean };

/** Récompense gagnée, figée au moment où la carte s'est remplie */
/** alcool : la récompense gagnée est la version avec alcool (figé au moment du gain ; absent = sans alcool) */
export type RecompensePrete = { id: number; libelle: string; gagneeLe: string; alcool?: boolean };

export type DemandeRecompense = { id: number; recompenseId: number; code: string; creeLe: string; expireLe: string };

export type CarteFidelite = {
  lieu: LieuResume;
  programmeActif: boolean;
  tampons: number;
  sur: number;
  recompense: string;
  /** La récompense montrée est la version avec alcool : le message sanitaire s'affiche à côté */
  recompenseAlcool: boolean;
  pretes: RecompensePrete[];
  demande: DemandeRecompense | null;
};

export type EtatCarteFidelite = { tampons: number; pretes: RecompensePrete[] };
