// Données de départ de la démo des visites (en développement seulement) : deux figurants, cinq cartes de fidélité, ta carte
// au Restaurant du Capitaine Bouiboui, ta visite chez Sucre & Garrigue, et le comptoir du Capitaine (Karim attend, Inès a
// réservé). Le Capitaine est le lieu joué par le mode pro (lieu-demo-pro.ts) : un nom inventé, jamais celui d'un vrai lieu.
// Les dates sont relatives : creerMagasinInitial les pose par rapport au moment où la démo démarre.
import type { ReglageFidelite } from "@sos-miam/commun/types/fidelite";
import type { ModeValidation } from "@sos-miam/commun/types/visite";

import { LIEU_DEMO_PRO_ID } from "~/contenus/lieu-demo-pro";
import type { CleClientDemo, ClientDemo } from "~/services/demo/types-demo";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

/** Les autres clients de la démo, vus par l'équipe : prénom, initiale et emoji, jamais l'âge */
export const figurantsExemples: readonly ClientDemo[] = [
  { cle: "figurant:karim", prenom: "Karim", initialeNom: "B", avatar: "🦊", majeur: true },
  { cle: "figurant:ines", prenom: "Inès", initialeNom: null, avatar: "🐙", majeur: true },
];

export type ProgrammeExemple = ReglageFidelite & { lieuId: number };

/** Cartes de fidélité des lieux d'exemple ; une récompense avec alcool a toujours sa version sans alcool */
export const programmesExemples: readonly ProgrammeExemple[] = [
  { lieuId: LIEU_DEMO_PRO_ID, actif: true, visitesRequises: 5, recompense: "Une île flottante maison", alcool: false, recompenseSansAlcool: null },
  { lieuId: 0, actif: true, visitesRequises: 5, recompense: "Un tiramisu maison", alcool: false, recompenseSansAlcool: null },
  { lieuId: 1, actif: true, visitesRequises: 5, recompense: "Un chou à la crème", alcool: false, recompenseSansAlcool: null },
  { lieuId: 13, actif: true, visitesRequises: 5, recompense: "Un verre de picpoul", alcool: true, recompenseSansAlcool: "Un café gourmand" },
  { lieuId: 5, actif: true, visitesRequises: 6, recompense: "Un verre offert", alcool: true, recompenseSansAlcool: "Un sirop maison" },
];

/** Tampons déjà posés au départ (ceux des visites d'exemple s'y ajoutent tout seuls) */
export type CarteExemple = { lieuId: number; client: CleClientDemo; tampons: number };

export const cartesExemples: readonly CarteExemple[] = [
  { lieuId: LIEU_DEMO_PRO_ID, client: "moi", tampons: 4 },
  { lieuId: LIEU_DEMO_PRO_ID, client: "figurant:karim", tampons: 2 },
];

/** Petite note affichée par le bandeau de démo à côté d'une carte d'exemple (par lieu) */
export const notesCartesExemples: Readonly<Record<number, string>> = {
  [LIEU_DEMO_PRO_ID]: "4 tampons offerts pour essayer",
};

/**
 * Visites de départ. Une visite « validee » est rejouée avec les vraies règles (demandée, puis réglée quelques minutes
 * après) : points au journal, tampon et avis ouvert une heure plus tard, comme pour de vrai.
 */
export type VisiteExemple = {
  lieuId: number;
  client: CleClientDemo;
  mode: ModeValidation;
  statut: "demandee" | "validee";
  code: string | null;
  /** Il y a combien de temps l'addition a été demandée */
  ilYaMs: number;
  /** Combien de temps après la demande le lieu l'a réglée (visite validée) */
  regleeApresMs: number;
};

export const visitesExemples: readonly VisiteExemple[] = [
  { lieuId: 1, client: "moi", mode: "addition", statut: "validee", code: "2741", ilYaMs: 2 * JOUR, regleeApresMs: 6 * MINUTE },
  { lieuId: LIEU_DEMO_PRO_ID, client: "figurant:karim", mode: "addition", statut: "demandee", code: "5307", ilYaMs: 3 * MINUTE, regleeApresMs: 0 },
];

/** Réservations acceptées au départ : « ce soir » à l'heure dite (demain si ce soir est déjà loin derrière) */
export type ReservationExemple = {
  lieuId: number;
  client: CleClientDemo;
  personnes: number;
  heure: string;
  demandeeIlYaMs: number;
  reponduIlYaMs: number;
};

export const reservationsExemples: readonly ReservationExemple[] = [
  { lieuId: LIEU_DEMO_PRO_ID, client: "figurant:ines", personnes: 2, heure: "20:00", demandeeIlYaMs: 26 * HEURE, reponduIlYaMs: 25 * HEURE },
];
