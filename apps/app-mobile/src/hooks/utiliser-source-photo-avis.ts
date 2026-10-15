import { useCallback } from "react";

import { PHOTOS_AVIS_DEMO } from "~/contenus/photos-avis-demo";
import type { SourcePhotoAvis } from "~/contenus/type-donner-avis";
import { construireAdressePhotoAvis } from "~/fonctions/avis/construire-adresse-photo-avis";
import { utiliserServices } from "~/hooks/utiliser-services";
import { lirePhotoAvisDemo } from "~/services/demo/photos-avis-demo";

export function utiliserSourcePhotoAvis(): (photo: string | null) => SourcePhotoAvis | null {
  const { source } = utiliserServices();
  return useCallback(
    (photo: string | null) => {
      if (!photo) return null;
      if (source !== "demo") return { uri: construireAdressePhotoAvis(photo) };
      const exemple = PHOTOS_AVIS_DEMO[photo];
      if (exemple !== undefined) return exemple;
      const locale = lirePhotoAvisDemo(photo);
      return locale ? { uri: locale } : null;
    },
    [source],
  );
}
