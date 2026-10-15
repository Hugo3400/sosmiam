import type { StatutReservation } from "./reservation.ts";

export type NouvelleReservationDecidee =
  | { ok: true; statut: "acceptee" | "demandee"; creneau: string; creneauxProposes: string[]; automatique: boolean }
  | { ok: false; erreur: "creneau-complet" };

export type DemandeAAccepter = { creneau: string; creneauxProposes: readonly string[]; personnes: number };

export type AcceptationHoraire =
  | { ok: true; creneau: string; depassement: number; horsReglages: boolean; jourFerme: boolean }
  | { ok: false; erreur: "horaire-non-propose" | "delai-depasse" }
  | { ok: false; erreur: "capacite-depassee" | "jour-ferme"; creneau: string; places: number | null };

export type ReservationDuCompte = {
  lieuId: number;
  statut: StatutReservation;
  creneau: string;
  creneauxProposes: readonly string[];
  creeLe: string;
};

export type NouvelleReservationDuCompte = { lieuId: number; creneauxProposes: readonly string[] };
