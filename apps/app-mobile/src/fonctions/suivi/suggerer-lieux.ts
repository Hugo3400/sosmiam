import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";

type Entree = {
  /** Lieux qu'on peut montrer (sans bar en visite sans compte : filtrerLieuxSelonAge) */
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
export function suggererLieux({ lieux, depart, exclus, max }: Entree, langue: Langue): { lieu: Lieu; raison: string }[] {
  if (!depart) return [];
  const T = choisirTextes(TEXTES_SUIVI_PAR_LANGUE, langue).raisons;
  return lieux
    .filter((lieu) => lieu.position && !exclus.has(lieu.id))
    .map((lieu) => ({ lieu, km: calculerKmLieu(lieu, depart) }))
    .filter((l): l is { lieu: Lieu; km: number } => l.km !== null && l.km <= RAYON_PROCHE_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, max)
    .map(({ lieu, km }) => ({ lieu, raison: T.aDistance(formaterDistanceLangue(km, langue)) }));
}
