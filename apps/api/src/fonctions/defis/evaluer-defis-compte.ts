import { compterMesureDefi } from "../../../../../packages/commun/src/fonctions/defis/compter-mesure-defi.ts";
import { calculerEtatDefi } from "../../../../../packages/commun/src/fonctions/defis/calculer-etat-defi.ts";
import { calculerJourParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { decalerJour } from "../../../../../packages/commun/src/fonctions/temps/decaler-jour.ts";
import { BADGES_AUTOMATIQUES } from "../../../../../packages/commun/src/regles/badges-automatiques.ts";
import { JOURS_RATTRAPAGE_DEFI, MESURES_DEFI } from "../../../../../packages/commun/src/regles/defis.ts";
import type { IdBadge } from "../../../../../packages/commun/src/types/badge.ts";
import type { DefiApp, FaitsDefi, MesureDefi } from "../../../../../packages/commun/src/types/defi.ts";
import type { DefiEnBase, ReussiteEnBase } from "../../services/defis-regles.ts";
import { lireFiltresEnBase } from "./lire-filtres-en-base.ts";

type EntreeEvaluation = {
  /** Les défis publiés (dans l'ordre d'affichage : ordre, premier jour, id) */
  defis: DefiEnBase[];
  /** Les réussites du compte (tous défis) */
  reussites: ReussiteEnBase[];
  faits: FaitsDefi;
  /** Les badges que le compte a déjà */
  badges: readonly string[];
  maintenant: Date;
};

export type EvaluationDefis = {
  /** Ce que l'app montre : à venir, en cours, réussis (même finis) */
  defis: DefiApp[];
  /** Défis atteints pas encore réussis : réussite à écrire, points à créditer (ceux du défi, figés) */
  aCrediter: { defiId: number; points: number }[];
  /** Réussites retombées sous l'objectif avant la fin : à effacer, points à reprendre (ceux qui avaient été crédités) */
  aReprendre: { defiId: number; points: number }[];
  /** Badges automatiques atteints que le compte n'a pas encore */
  badges: IdBadge[];
};

/**
 * Décide, une seule fois pour la base et pour le double en mémoire, ce qui change pour un compte à cet instant :
 * - défi commencé (premier jour passé, à Paris), avancée = mesure de sa période, limitée à l'objectif ;
 * - atteint et pas encore réussi → à créditer, jusqu'à son dernier jour et pendant JOURS_RATTRAPAGE_DEFI jours ensuite
 *   (les faits comptés restent ceux de sa période) ; au-delà, un défi fini sans réussite est figé et n'est plus montré ;
 * - réussi, pas encore fini, et retombé sous l'objectif (rescousse reprise, visite retirée) → à reprendre ;
 * - après son dernier jour, une réussite reste acquise ;
 * - badges automatiques (BADGES_AUTOMATIQUES, sans dates) : donnés une fois, jamais retirés.
 * Une mesure inconnue n'est jamais comptée (le défi n'est pas montré).
 */
export function evaluerDefisCompte({ defis, reussites, faits, badges, maintenant }: EntreeEvaluation): EvaluationDefis {
  const jour = calculerJourParis(maintenant.getTime());
  const reussiteDe = new Map(reussites.map((r) => [r.defiId, r]));
  const evaluation: EvaluationDefis = { defis: [], aCrediter: [], aReprendre: [], badges: [] };

  for (const defi of defis) {
    if (!(MESURES_DEFI as readonly string[]).includes(defi.mesure)) continue;
    const reussite = reussiteDe.get(defi.id);
    // Réussi : les points crédités (figés dans la réussite), même si le défi a changé de points depuis
    const montrer = (fait: number, reussiLe: Date | null, points = defi.points) =>
      evaluation.defis.push({
        id: defi.id, emoji: defi.emoji, titre: defi.titre, texte: defi.texte, objectif: defi.objectif, fait, points,
        debut: defi.debut, fin: defi.fin, etat: calculerEtatDefi(defi, reussiLe !== null, jour), reussiLe: reussiLe?.toISOString() ?? null,
      });
    const fini = defi.fin !== null && jour > defi.fin;
    if (reussite && (fini || jour < defi.debut)) {
      montrer(defi.objectif, reussite.reussiLe, reussite.points);
      continue;
    }
    if (jour < defi.debut) {
      montrer(0, null);
      continue;
    }
    if (!reussite && fini && jour > decalerJour(defi.fin!, JOURS_RATTRAPAGE_DEFI)) continue;

    const mesure = compterMesureDefi(faits, defi.mesure as MesureDefi, lireFiltresEnBase(defi.filtres), { debut: defi.debut, fin: defi.fin });
    const fait = Math.min(mesure, defi.objectif);
    if (reussite && fait < defi.objectif) {
      evaluation.aReprendre.push({ defiId: defi.id, points: reussite.points });
      montrer(fait, null);
    } else if (reussite) {
      montrer(defi.objectif, reussite.reussiLe, reussite.points);
    } else if (fait >= defi.objectif) {
      evaluation.aCrediter.push({ defiId: defi.id, points: defi.points });
      montrer(defi.objectif, maintenant);
    } else if (!fini) {
      montrer(fait, null);
    }
  }

  for (const badge of BADGES_AUTOMATIQUES) {
    if (badges.includes(badge.id)) continue;
    if (compterMesureDefi(faits, badge.mesure, badge.filtres, { debut: null, fin: null }) >= badge.objectif) evaluation.badges.push(badge.id);
  }
  return evaluation;
}
