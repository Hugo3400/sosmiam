// Contrat du service des réservations, côté client : créneaux, réserver, annuler, et « Je suis là ».

import type { LecturePosition } from "../types/position.ts";
import type { DemandeReservation, Reservation } from "../types/reservation.ts";
import type { ResultatValidation } from "../types/visite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceReservations {
  listerCreneaux(lieuId: number, jour: string): Promise<ReponseApi<{ creneaux: string[] }>>;
  reserver(demande: DemandeReservation): Promise<ReponseApi<{ reservation: Reservation }>>;
  listerReservations(): Promise<ReponseApi<{ reservations: Reservation[] }>>;
  lireReservation(id: number): Promise<ReponseApi<{ reservation: Reservation }>>;
  annulerReservation(id: number): Promise<ReponseApi<{ reservation: Reservation }>>;
  signalerPresence(
    id: number,
    position: LecturePosition,
  ): Promise<ReponseApi<{ reservation: Reservation; validation: ResultatValidation | null }>>;
}
