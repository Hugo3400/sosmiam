// Défis de l'app et badges automatiques (décidé le 14 octobre 2026) : contrat commun du service Prisma (defis.ts) et de son
// double en mémoire (defis-en-memoire.ts). Le moteur de mesure (compterMesureDefi) et les règles (regles/defis.ts,
// regles/badges-automatiques.ts) sont dans packages/commun ; ce qui change à chaque réévaluation est décidé une seule fois,
// par evaluerDefisCompte (fonctions/defis/).
//
// Gestion (routes /api-gestion/defis du logiciel, branchées par la session Logiciel) : listerGestion, creer, modifier,
// supprimer. Le corps reçu passe tel quel : validerDefi (packages/commun) le vérifie ici.
import type { IdBadge } from "../../../../packages/commun/src/types/badge.ts";
import type { ChampDefi, DefiApp, DefiGestion } from "../../../../packages/commun/src/types/defi.ts";

/** ajouterPoints de services/comptes.ts, tel que les défis s'en servent (négatif : retire ; jamais emballé par la réévaluation) */
export type AjouterPointsDefi = (compteId: number, points: number, raison: "defi", detail: string) => Promise<unknown>;

/** Ce dont les défis ont besoin des comptes : points (raison « defi ») et badges (donnerBadge, sans effet s'il est déjà là) */
export type DependancesServicesDefis = {
  ajouterPoints: AjouterPointsDefi;
  donnerBadge: (compteId: number, badge: string) => Promise<unknown>;
};

/** Ce qu'une réévaluation a changé : défis réussis (points crédités), réussites reprises (points retirés), badges donnés */
export type BilanReevaluation = { reussis: number[]; repris: number[]; badges: IdBadge[] };

/** Un défi tel que la base le garde (mesure et filtres relus avec prudence : une valeur inconnue n'est jamais comptée) */
export type DefiEnBase = {
  id: number; emoji: string; titre: string; texte: string; mesure: string; filtres: unknown; objectif: number; points: number;
  debut: string; fin: string | null; publie: boolean; ordre: number;
};

/** Une réussite gardée : ses points, figés au moment de la réussite, sont ceux qu'on reprend */
export type ReussiteEnBase = { defiId: number; points: number; reussiLe: Date };

export type ErreurGestionDefi = "defi-inconnu" | "defi-deja-reussi";

export type ResultatEcritureDefi =
  | { ok: true; defi: DefiGestion }
  | { ok: false; erreur: "champ-invalide"; champ: ChampDefi }
  | { ok: false; erreur: ErreurGestionDefi };

/** Ce qui ne change plus dès qu'un compte a réussi le défi : la règle (le premier jour compris, qui changerait l'avancée) */
export const CHAMPS_FIGES_APRES_REUSSITE = ["mesure", "filtres", "objectif", "debut"] as const satisfies readonly ChampDefi[];

export interface ServicesDefis {
  /**
   * Les défis publiés pour l'app (GET /app/defis), triés par ordre puis premier jour : à venir, en cours, réussis (même
   * finis). Réévalue d'abord (rattrape un avis sans photo, un défi qui vient de commencer).
   */
  listerPourCompte(compteId: number, maintenant: Date): Promise<DefiApp[]>;
  /**
   * Recompte l'avancée du compte, sous verrou (la ligne du compte) : crédite un défi atteint une seule fois, reprend une
   * réussite retombée avant la fin, donne les badges automatiques atteints (jamais retirés).
   */
  reevaluer(compteId: number, maintenant: Date): Promise<BilanReevaluation>;
  /** Tous les défis, brouillons compris, avec leur nombre de réussites (ordre, premier jour, id) */
  listerGestion(): Promise<DefiGestion[]>;
  /** `brut` : le corps reçu (BrouillonDefi), vérifié par validerDefi */
  creer(brut: unknown): Promise<ResultatEcritureDefi>;
  /**
   * `brut` : les champs à changer (Partial<BrouillonDefi>), fusionnés avec le défi gardé puis vérifiés par validerDefi.
   * « defi-deja-reussi » : changer mesure, filtres, objectif ou premier jour d'un défi déjà réussi par quelqu'un.
   */
  modifier(id: number, brut: unknown): Promise<ResultatEcritureDefi>;
  /** « defi-deja-reussi » : un défi déjà réussi ne se supprime pas (on le dépublie) */
  supprimer(id: number): Promise<{ ok: true } | { ok: false; erreur: ErreurGestionDefi }>;
}
