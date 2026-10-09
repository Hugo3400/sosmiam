// Réservations faites dans l'app (docs/decisions.md, « Scan et validation des visites ») : les lignes lues et écrites. Les
// gestes sont dans les tables des visites (visites-regles.ts, TablesVisites) : une réservation honorée crée une visite dans
// la même transaction. Règles au-dessus (reservations-client.ts, reservations-pro.ts) ; machine à états :
// faireEvoluerReservation (packages/commun). Sans accès à la base ici.
import type { DetailsErreur } from "../../../../packages/commun/src/client-api/reponse-api.ts";
import type { ErreurService } from "../../../../packages/commun/src/types/erreurs-service.ts";
import type { MotifRefusReservation, StatutReservation } from "../../../../packages/commun/src/types/reservation.ts";

/** Réservations rendues à la personne (« Mes réservations ») */
export const RESERVATIONS_RENDUES = 100;
/** Réservations montrées à l'équipe (à venir et du jour) */
export const RESERVATIONS_AU_COMPTOIR = 300;

export type LigneReservation = {
  id: number;
  compteId: number;
  lieuId: number;
  personnes: number;
  creneau: Date;
  message: string | null;
  statut: StatutReservation;
  motifRefus: MotifRefusReservation | null;
  tardive: boolean;
  creeLe: Date;
  reponduLe: Date | null;
  /** Le dernier membre de l'équipe qui a répondu, touché « Venu », « Pas venu » ou annulé */
  reponduParId: number | null;
  presenceLe: Date | null;
  code: string | null;
};
export type NouvelleReservation = Omit<LigneReservation, "id">;
export type ChampsReservation = Partial<Omit<LigneReservation, "id" | "compteId" | "lieuId" | "creeLe">>;

/** `creneauDepuis` compris, `creneauAvant` exclu ; ordre : créneau croissant par défaut */
export type FiltreReservations = {
  compteId?: number;
  lieuId?: number;
  statuts?: StatutReservation[];
  creneauDepuis?: Date;
  creneauAvant?: Date;
  limite?: number;
  ordre?: "creneau-croissant" | "creneau-decroissant";
};

/** « trop-de-reservations » : à ajouter à ErreurService (packages/commun) avec son message */
export type ErreurReservation = ErreurService | "trop-de-reservations";
export type EchecReservation = { ok: false; erreur: ErreurReservation; details?: DetailsErreur; champ?: string };
