import type { TypeClocheCommunaute } from "../types/communaute.ts";

export const MAX_SORTIES_MIAMIS_A_VENIR = 5;
export const MAX_SORTIES_MIAMIS_LISTEES = 100;
export const HEURES_INVITATION_HABITUES = 48;
export const HEURES_DESISTEMENT_TARDIF = 24;
export const JOURS_RECURRENCE_SORTIE_MIAMIS = 7;
export const JOURS_CONSERVATION_SORTIES_MIAMIS = 365;

export const MINUTES_PRESENCE_QUI_EST_LA = 180;
export const HEURES_CONSERVATION_COUCOU = 24;
export const MAX_PRESENTS_LISTES = 100;

export const MAX_IDEES_LISTEES = 300;
export const MAX_COMMENTAIRES_IDEE_LISTES = 300;
export const LONGUEUR_MAX_COMMENTAIRE_IDEE = 500;
export const LONGUEUR_MAX_REPONSE_BRIGADE = 1000;
export const VOTANTS_NOMMES_IDEE = 3;

export const JOURS_FIL_MIAMIS = 7;
export const MAX_EVENEMENTS_FIL_MIAMIS = 30;

export const TYPES_CLOCHE_COMMUNAUTE = [
  "demande-sortie-miamis",
  "arrivee-acceptee",
  "liste-attente-miamis",
  "place-liberee-miamis",
  "rappel-sortie-miamis",
  "sortie-miamis-annulee",
  "invitation-habitue",
  "coucou-reciproque",
  "idee-publiee",
  "reponse-brigade",
  "idee-du-mois",
] as const satisfies readonly TypeClocheCommunaute[];
