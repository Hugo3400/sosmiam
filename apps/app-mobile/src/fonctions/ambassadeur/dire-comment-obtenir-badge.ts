import type { IdBadge } from "@sos-miam/commun/types/badge";
import { PRECISIONS_BADGES } from "~/contenus/precisions-badges";
import { TEXTES_BADGES } from "~/contenus/textes-badges";

export function direCommentObtenirBadge(id: IdBadge): string {
  const precision = PRECISIONS_BADGES[id];
  if (precision && !precision.possible) return precision.texte;
  return precision?.texte ?? TEXTES_BADGES.possible;
}
