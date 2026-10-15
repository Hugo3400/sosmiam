import type { CreneauOuverture } from "../types/lieu.ts";
import type { ReglagesReservations, ReglagesServicesReservations, ReservationARevoir } from "../types/reglages-reservations.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type ReglagesReservationsLus = {
  reglages: ReglagesReservations;
  regle: boolean;
  aRevoir: ReservationARevoir[];
  reservable: boolean;
  ouverture: CreneauOuverture[];
};

export type ReponseReglagesReservations = ReponseApi<ReglagesReservationsLus>;

export interface ServiceReglagesReservations {
  lireReglages(lieuId: number): Promise<ReponseReglagesReservations>;
  reglerReservations(lieuId: number, reglages: ReglagesServicesReservations): Promise<ReponseReglagesReservations>;
  fermerJour(lieuId: number, jour: string, ferme: boolean): Promise<ReponseReglagesReservations>;
}
