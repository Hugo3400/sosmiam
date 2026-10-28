import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CARTE_AVIS } from "~/contenus/textes-carte-avis";

export const TEXTES_CARTE_AVIS_ANGLAIS: Traduction<typeof TEXTES_CARTE_AVIS> = {
  visiteVerifiee: "✓ Verified visit",
  nonVerifie: "Review not verified",
  reponseLieu: "Reply from {lieu} · {mois}",
  photoLue: "Photo from {signature}'s review",
};
