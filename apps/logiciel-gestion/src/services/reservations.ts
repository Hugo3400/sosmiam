// Le bilan des réservations par lieu (lecture seule) : des nombres, jamais un client.
import { appeler, parametres } from "./client-gestion.ts";

export type PeriodeReservations = 30 | 90 | 365;
export type BilanReservations = {
  demandes: number; enAttente: number; sansReponse: number; refusees: number; acceptees: number; honorees: number; absents: number;
  annulees: number; tardives: number; motifsRefus: Record<string, number>;
  /** De 0 à 1 (null : rien à juger) */
  tauxReponse: number | null;
  reponseMedianeMin: number | null;
};
export type ReservationsLieu = BilanReservations & { lieu: { id: number; nom: string; ville: string; statut: string }; repondPas: boolean };
export type ReservationsGestion = {
  jours: PeriodeReservations;
  totaux: BilanReservations & { lieux: number; lieuxQuiRepondentPas: number };
  lieux: ReservationsLieu[];
};

export const lireReservations = (jours: PeriodeReservations, ville: string) => appeler<ReservationsGestion>("GET", `/reservations${parametres({ jours, ville })}`);
