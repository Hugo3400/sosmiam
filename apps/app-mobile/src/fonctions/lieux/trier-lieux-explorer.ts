import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";

/**
 * Un lieu et sa distance : depuis ta position (« Autour de moi »), sinon depuis le centre de ta ville, sinon sa distance
 * d'exemple ; null si on ne la connaît pas (lieu pas encore placé sur la carte) : rien ne s'affiche.
 */
export type LieuExplorer = { lieu: Lieu; km: number | null };

/** Du plus près au plus loin ; une distance inconnue passe toujours après une distance connue */
function comparerKm(a: number | null, b: number | null): number {
  if (a === null || b === null) return Number(a === null) - Number(b === null);
  return a - b;
}

/**
 * Trie les lieux d'Explorer : les plus proches d'abord quand on connaît ta position (« Autour de moi »), ceux dont on ne
 * connaît pas la distance tout au bout ; sinon ceux qui te ressemblent le plus (même score que le fil « Pour toi », avec
 * la distance depuis ta ville). « depart » : le centre de la ville de ton profil (null si on ne la connaît pas).
 */
export function trierLieuxExplorer(lieux: Lieu[], profil: Profil | null, position: PositionLieu | null, depart: PositionLieu | null): LieuExplorer[] {
  const avecDistance = lieux.map((lieu) => ({ lieu, km: calculerKmLieu(lieu, position ?? depart) }));
  if (position) return avecDistance.sort((a, b) => comparerKm(a.km, b.km));
  if (!profil) return avecDistance;
  const scores = new Map(avecDistance.map(({ lieu, km }) => [lieu.id, calculerScoreLieu(lieu, profil, km)]));
  return avecDistance.sort((a, b) => (scores.get(b.lieu.id) ?? 0) - (scores.get(a.lieu.id) ?? 0));
}
