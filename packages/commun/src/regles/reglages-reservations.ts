import type { DelaiReservation, ModeAcceptationReservation, PasCreneaux, ReglagesReservations } from "../types/reglages-reservations.ts";
import type { ErreurService } from "../types/erreurs-service.ts";
import type { StatutReservation } from "../types/reservation.ts";

export const MODES_ACCEPTATION_RESERVATION: readonly ModeAcceptationReservation[] = ["manuelle", "automatique"];

export const PAS_CRENEAUX_POSSIBLES: readonly PasCreneaux[] = [15, 30];

export const DELAIS_RESERVATION: readonly DelaiReservation[] = ["30-min", "1-h", "2-h", "veille"];

export const DELAIS_RESERVATION_MS: Readonly<Record<Exclude<DelaiReservation, "veille">, number>> = {
  "30-min": 30 * 60_000,
  "1-h": 60 * 60_000,
  "2-h": 2 * 60 * 60_000,
};

export const EXPIRATION_DELAI_COURT_MS = 10 * 60_000;

export const SERVICES_RESERVATION_MAX = 12;

export const COUVERTS_PAR_SERVICE_MAX = 3000;

export const COUVERTS_PAR_CRENEAU_MAX = 500;

export const FIN_SERVICE_MAX_MIN = 24 * 60;

export const JOURS_FERMES_MAX = 120;

export const JOURS_FERMES_HORIZON = 365;

export const HORAIRES_PROPOSES_MAX = 3;

export const PEU_DE_PLACES_MIN = 4;

export const PEU_DE_PLACES_PART = 0.25;

export const DOUBLON_RESERVATION_MS = 2 * 60_000;

export const GRACE_ANNULATION_MS = 15 * 60_000;

export const REGLAGES_RESERVATIONS_DEFAUT: Readonly<ReglagesReservations> = {
  services: [],
  acceptation: "manuelle",
  delai: "1-h",
  joursFermes: [],
};

export const STATUTS_QUI_OCCUPENT: readonly StatutReservation[] = ["acceptee", "honoree"];

export const ERREURS_RESERVATION_A_RELIRE: readonly ErreurService[] = ["creneau-complet", "creneau-invalide"];
