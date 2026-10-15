import { STATUTS_AVIS_VISIBLES } from "../../services/avis-regles.ts";
import type { CitationPhotoAvis } from "../../services/photos-avis-regles.ts";

export function estPhotoAvisPublique(citations: readonly CitationPhotoAvis[]): boolean {
  return citations.some((c) => c.lieuPublie && STATUTS_AVIS_VISIBLES.includes(c.statut));
}
