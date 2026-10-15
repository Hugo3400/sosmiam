import type { CitationPhotoAvis, DecisionPhotoAvis, SeuilsMenagePhotosAvis } from "../../services/photos-avis-regles.ts";
import { estFichierGardeParSignalement } from "../social/est-fichier-garde-par-signalement.ts";

export type SortPhotoAvis = "garder" | "effacer";

function estGardeeParAvisMasque(citation: CitationPhotoAvis, decisions: readonly DecisionPhotoAvis[], seuil: Date): boolean {
  const siennes = decisions.filter((d) => d.avisId === citation.avisId);
  if (siennes.length === 0) return citation.creeLe.getTime() > seuil.getTime();
  return siennes.some((d) => estFichierGardeParSignalement(d, seuil));
}

export function deciderSortPhotoAvis(
  photo: { deposeLe: Date; citations: readonly CitationPhotoAvis[]; decisions: readonly DecisionPhotoAvis[] },
  seuils: SeuilsMenagePhotosAvis,
): SortPhotoAvis {
  if (photo.citations.length === 0) return photo.deposeLe.getTime() < seuils.orphelins.getTime() ? "effacer" : "garder";
  const gardee = photo.citations.some((c) => c.statut !== "masque" || estGardeeParAvisMasque(c, photo.decisions, seuils.contestation));
  return gardee ? "garder" : "effacer";
}
