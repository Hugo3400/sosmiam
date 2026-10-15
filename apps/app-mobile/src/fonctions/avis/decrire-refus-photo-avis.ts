import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";

export function decrireRefusPhotoAvis(erreur: ErreurService): string {
  if (erreur === "media-trop-lourd") return TEXTES_DONNER_AVIS.photoTropLourde;
  if (erreur === "stockage-plein") return TEXTES_DONNER_AVIS.photoPlacardsPleins;
  if (erreur === "introuvable") return TEXTES_DONNER_AVIS.photoPasEncore;
  return TEXTES_DONNER_AVIS.photoRefusee;
}
