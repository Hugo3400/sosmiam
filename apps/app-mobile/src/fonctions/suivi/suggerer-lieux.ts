import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";

type Entree = {
  /** Lieux que ton âge permet */
  lieux: readonly Lieu[];
  /** Ta position, ou le centre de ta ville ; null : on ne sait pas où tu es, donc aucun lieu « proche » */
  depart: PositionLieu | null;
  /** Lieux à ne pas proposer (déjà suivis, suggestions masquées) */
  exclus: ReadonlySet<number>;
  max: number;
};

// Au-delà, ce n'est plus « près de chez toi » : mieux vaut ne rien proposer que « À 600 km »
const RAYON_PROCHE_KM = 50;

/** Les lieux les plus proches à suivre, du plus près au plus loin, avec leur distance comme raison (« À 350 m »). Seulement les lieux placés sur la carte. */
export function suggererLieux({ lieux, depart, exclus, max }: Entree): { lieu: Lieu; raison: string }[] {
  if (!depart) return [];
  return lieux
    .filter((lieu) => lieu.position && !exclus.has(lieu.id))
    .map((lieu) => ({ lieu, km: calculerKmLieu(lieu, depart) }))
    .filter(({ km }) => km <= RAYON_PROCHE_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, max)
    .map(({ lieu, km }) => ({ lieu, raison: `À ${formaterDistance(km)}` }));
}
