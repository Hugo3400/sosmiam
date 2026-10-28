import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CARTE_AVIS_ANGLAIS } from "~/contenus/anglais/textes-carte-avis";

export const TEXTES_CARTE_AVIS = {
  visiteVerifiee: "✓ Visite vérifiée",
  nonVerifie: "Avis non vérifié",
  reponseLieu: "Réponse de {lieu} · {mois}",
  photoLue: "Photo de l'avis de {signature}",
} as const;

export const TEXTES_CARTE_AVIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_AVIS>> = { fr: TEXTES_CARTE_AVIS, en: TEXTES_CARTE_AVIS_ANGLAIS };
