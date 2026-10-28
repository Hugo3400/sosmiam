import { useCallback } from "react";

import type { SourcePhotoAvis } from "~/contenus/type-donner-avis";
import { construireAdressePhotoAvis } from "~/fonctions/avis/construire-adresse-photo-avis";

export function utiliserSourcePhotoAvis(): (photo: string | null) => SourcePhotoAvis | null {
  return useCallback((photo: string | null) => (photo ? { uri: construireAdressePhotoAvis(photo) } : null), []);
}
