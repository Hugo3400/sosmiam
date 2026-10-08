import type { ImageSourcePropType } from "react-native";

import type { Publication } from "~/contenus/type-publication";

/** Image qui représente une publication en petit : l'affiche de sa vidéo ou sa première photo (null sans média). */
export function trouverVignettePublication(publication: Publication): ImageSourcePropType | null {
  const media = publication.media;
  if (!media) return null;
  return media.type === "video" ? media.affiche : (media.photos[0] ?? null);
}
