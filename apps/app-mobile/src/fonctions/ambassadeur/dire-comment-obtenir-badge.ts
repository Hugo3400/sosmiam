import type { IdBadge } from "@sos-miam/commun/types/badge";
import { MESURES_BADGES_DEMO } from "~/contenus/badges-demo";
import { PRECISIONS_BADGES } from "~/contenus/precisions-badges";
import { TEXTES_BADGES } from "~/contenus/textes-badges";

export function direCommentObtenirBadge(id: IdBadge, demo: boolean): string {
  const precision = PRECISIONS_BADGES[id];
  if (precision && !precision.possible) return precision.texte;
  if (demo) return MESURES_BADGES_DEMO[id] ? TEXTES_BADGES.possible : TEXTES_BADGES.sousCleDemo;
  return precision?.texte ?? TEXTES_BADGES.possible;
}
