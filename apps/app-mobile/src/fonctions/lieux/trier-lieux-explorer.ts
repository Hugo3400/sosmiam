import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import type { Profil } from "@sos-miam/commun/types/profil";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";

/** Un lieu et sa distance (calculée depuis ta position quand on l'a, sinon la distance d'exemple du lieu). */
export type LieuExplorer = { lieu: Lieu; km: number };

/**
 * Trie les lieux d'Explorer : les plus proches d'abord quand on connaît ta position (« Autour de moi »),
 * sinon ceux qui te ressemblent le plus (même score que le fil « Pour toi »).
 */
export function trierLieuxExplorer(lieux: Lieu[], profil: Profil | null, position: PositionLieu | null): LieuExplorer[] {
  const avecDistance = lieux.map((lieu) => ({ lieu, km: position && lieu.position ? calculerDistance(position, lieu.position) : lieu.km }));
  if (position) return avecDistance.sort((a, b) => a.km - b.km);
  if (!profil) return avecDistance;
  return avecDistance.sort((a, b) => calculerScoreLieu(b.lieu, profil) - calculerScoreLieu(a.lieu, profil));
}
