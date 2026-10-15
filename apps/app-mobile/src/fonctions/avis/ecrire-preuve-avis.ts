import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import type { AvisPublic } from "@sos-miam/commun/types/avis";

import { TEXTES_CARTE_AVIS } from "~/contenus/textes-carte-avis";

export function ecrirePreuveAvis(avis: Pick<AvisPublic, "verifie" | "preuve">): string {
  if (!avis.verifie) return TEXTES_CARTE_AVIS.nonVerifie;
  return avis.preuve ? `${TEXTES_CARTE_AVIS.visiteVerifiee} · ${LIBELLES_MODE_VALIDATION[avis.preuve]}` : TEXTES_CARTE_AVIS.visiteVerifiee;
}
