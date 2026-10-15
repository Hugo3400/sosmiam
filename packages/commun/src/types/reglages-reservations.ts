import type { StatutReservation } from "./reservation.ts";

export type ModeAcceptationReservation = "manuelle" | "automatique";

export type DelaiReservation = "30-min" | "1-h" | "2-h" | "veille";

export type PasCreneaux = 15 | 30;

export type ServiceReservation = {
  jours: number[];
  premier: string;
  dernier: string;
  pas: PasCreneaux;
  couvertsParService: number;
  couvertsParCreneau: number;
};

export type ReglagesServicesReservations = {
  services: ServiceReservation[];
  acceptation: ModeAcceptationReservation;
  delai: DelaiReservation;
};

export type ReglagesReservations = ReglagesServicesReservations & { joursFermes: string[] };

export type OccupationReservation = { creneau: string; personnes: number };

export type CreneauDisponible = { heure: string; peuDePlaces: boolean };

export type PlaceHoraireReservation = { places: number | null; horsReglages: boolean; jourFerme: boolean };

export type RaisonReservationARevoir = "jour-ferme" | "hors-service" | "capacite";

export type ReservationARevoir = { id: number; creneau: string; raison: RaisonReservationARevoir };

export type ReservationAComparer = {
  id: number;
  creneau: string;
  creneauxProposes?: readonly string[];
  personnes: number;
  statut: StatutReservation;
};

export type MomentCreneau = "matin" | "midi" | "apres-midi" | "soir";

export type NomServiceReservation = { moment: MomentCreneau; rang: number | null };

export type EtatJourReservation = "ouvert" | "ferme" | "sans-resa" | "complet" | "trop-tard";

export type JourReservation = { jour: string; etat: EtatJourReservation };

export type EtatServiceDuJour = "ouvert" | "complet" | "trop-tard";

export type ServiceDuJour = { premier: string; dernier: string; pas: PasCreneaux; etat: EtatServiceDuJour };
