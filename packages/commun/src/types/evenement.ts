// Événements des lieux vérifiés (docs/decisions.md, « Décidé le 9 octobre 2026, au soir ») : ce que l'équipe du lieu publie,
// ce que voit l'app (fiche du lieu « À venir », Explorer, « Ça m'intéresse ») et ce que voit l'équipe au comptoir.
// Toutes les dates sont en ISO 8601 ; les heures se lisent à l'heure de Paris.

import type { LieuResume } from "./lieu-resume.ts";

export type TypeEvenement = "concert" | "soiree-theme" | "degustation" | "atelier" | "quiz" | "match" | "marche" | "autre";

/** Gratuit, prix indicatif (prixCentimes) ou sur réservation */
export type TarifEvenement = "gratuit" | "prix" | "reservation";

/** Ce que l'équipe du lieu envoie pour publier ou modifier un événement (vérifié par validerEvenement) */
export type ReglageEvenement = {
  /** 3 à 60 caractères, sans gros mot */
  titre: string;
  type: TypeEvenement;
  /** 500 caractères au plus (vide permis), sans gros mot */
  description: string;
  /** Début (la première fois, pour un événement de chaque semaine), à la minute */
  debut: string;
  /** Fin facultative, 24 h au plus après le début */
  fin: string | null;
  /** Chaque semaine, même jour et même heure (heure de Paris), jusqu'à cette date ; null : une seule fois */
  hebdoJusqua: string | null;
  tarif: TarifEvenement;
  /** Prix indicatif, seulement pour le tarif « prix » (null sinon) */
  prixCentimes: number | null;
  /** Places limitées (null : pas de limite annoncée) */
  places: number | null;
  /** Il y a de l'alcool (case cochée par le lieu ; cochée d'office si le titre ou la description en parle) */
  alcool: boolean;
};

export type ChampEvenement = keyof ReglageEvenement;

/** Une date d'un événement : la seule, ou une des dates d'un événement de chaque semaine */
export type OccurrenceEvenement = { debut: string; fin: string | null };

/**
 * Ce que voit l'app : un événement à une de ses dates (sur la fiche et dans « Ça m'intéresse » : la prochaine). Avec
 * alcool, l'app le cache aux 15-17 ans (et à l'âge inconnu) et affiche le message sanitaire à côté.
 */
export type EvenementLieuPublic = {
  id: number;
  lieu: LieuResume;
  titre: string;
  type: TypeEvenement;
  description: string;
  /** Cette date-ci */
  debut: string;
  fin: string | null;
  /** Chaque semaine jusqu'à cette date (null : une seule fois) */
  hebdoJusqua: string | null;
  tarif: TarifEvenement;
  prixCentimes: number | null;
  places: number | null;
  /** Adresse de la photo (pas encore d'envoi de fichier : toujours null pour l'instant) */
  photo: string | null;
  /** Case cochée, mot d'alcool dans le titre ou la description, ou lieu de type bar */
  alcool: boolean;
};

/** Un « Ça m'intéresse » de la personne connectée ; annulé : montré « Annulé » jusqu'à la date prévue, puis plus rien */
export type MonInteretEvenement = { evenement: EvenementLieuPublic; rappel: boolean; annule: boolean };

/** « a-venir » : une date pas encore finie ; « passe » : toutes finies ; « annule » : annulé par le lieu */
export type StatutEvenement = "a-venir" | "passe" | "annule";

/** Ce que voit l'équipe du lieu (comptoir) : le réglage, la prochaine date, les intéressés et qui l'a publié */
export type EvenementLieuPro = Omit<ReglageEvenement, "alcool"> & {
  id: number;
  photo: string | null;
  /** Comme dans l'app : case cochée, mot d'alcool ou lieu de type bar (l'événement est caché aux 15-17 ans) */
  alcool: boolean;
  /** La prochaine date pas encore finie (null : passé ou annulé) */
  prochaine: OccurrenceEvenement | null;
  statut: StatutEvenement;
  annuleLe: string | null;
  /** Masqué par la modération après un signalement : plus visible dans l'app */
  suspendu: boolean;
  /** Nombre de « Ça m'intéresse » (jamais qui) */
  interesses: number;
  /** Le prénom du membre de l'équipe qui l'a publié (null s'il a supprimé son compte depuis) */
  publiePar: string | null;
  creeLe: string;
  modifieLe: string;
};
