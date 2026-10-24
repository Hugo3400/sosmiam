import type { ParLangue } from "../types/traduction.ts";
import { CALENDRIER_ANGLAIS } from "./anglais/calendrier.ts";

export type Calendrier = {
  readonly mois: readonly string[];
  readonly moisCourts: readonly string[];
  readonly jours: readonly string[];
  readonly joursCourts: readonly string[];
};

export const CALENDRIER: Calendrier = {
  mois: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  moisCourts: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  jours: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  joursCourts: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
};

export const CALENDRIER_PAR_LANGUE: ParLangue<Calendrier> = { fr: CALENDRIER, en: CALENDRIER_ANGLAIS };
