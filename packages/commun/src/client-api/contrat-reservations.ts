// Contrat du service des réservations, côté client : créneaux, réserver, annuler, et « Je suis là ».

import type { LecturePosition } from "../types/position.ts";
import type {
  CreneauDisponible, DelaiReservation, JourReservation, ModeAcceptationReservation, ServiceDuJour,
} from "../types/reglages-reservations.ts";
import type { DemandeReservation, Reservation } from "../types/reservation.ts";
import type { ResultatValidation } from "../types/visite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type JoursReservationLus = {
  jours: JourReservation[];
  acceptation: ModeAcceptationReservation;
  delai: DelaiReservation;
  personnesMax: number;
};

export type CreneauxReservationLus = {
  creneaux: string[];
  disponibles: CreneauDisponible[];
  services: ServiceDuJour[];
  acceptation: ModeAcceptationReservation;
};

export interface ServiceReservations {
  listerJours(lieuId: number, personnes: number): Promise<ReponseApi<JoursReservationLus>>;
  listerCreneaux(lieuId: number, jour: string, personnes?: number): Promise<ReponseApi<CreneauxReservationLus>>;
  reserver(demande: DemandeReservation): Promise<ReponseApi<{ reservation: Reservation }>>;
  listerReservations(): Promise<ReponseApi<{ reservations: Reservation[] }>>;
  lireReservation(id: number): Promise<ReponseApi<{ reservation: Reservation }>>;
  annulerReservation(id: number): Promise<ReponseApi<{ reservation: Reservation }>>;
  signalerPresence(
    id: number,
    position: LecturePosition,
  ): Promise<ReponseApi<{ reservation: Reservation; validation: ResultatValidation | null }>>;
}
